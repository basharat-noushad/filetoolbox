// PDF -> positioned glyphs, vector segments, filled rectangles and images, using pdf.js.
// We interpret pdf.js's operator list ourselves (like a renderer would), which gives exact
// baselines, font names, fill colours and table rules - getTextContent() has no colours.
import { encodePng } from '../common/png.js';
import { encodeJpeg } from '../common/jpeg.js';
import { DEFAULT_LIMITS, LimitError } from '../common/limits.js';
import { findScan, orientation, ocrImage, ocrGlyphs } from './ocr.js';

const IDENT = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [ // m x n in pdf.js convention (apply n first, then m)
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

const MAX_PATHS = 20000; // per page; beyond this a page is a vector drawing better kept as an image

export function parseFontName(raw) {
  const name = String(raw || '').replace(/^[A-Z]{6}\+/, '');
  const lower = name.toLowerCase();
  const bold = /bold|black|heavy|semibold|demibold|-bd|,bd/.test(lower);
  const italic = /italic|oblique|-it\b|,it\b/.test(lower);
  let family = name.split(/[-,]/)[0].replace(/(PSMT|MT|PS)$/, '');
  const WORD = {
    carlito: 'Calibri', caladea: 'Cambria', liberationsans: 'Arial', arimo: 'Arial', arial: 'Arial', helvetica: 'Arial',
    liberationserif: 'Times New Roman', tinos: 'Times New Roman', timesnewroman: 'Times New Roman', times: 'Times New Roman',
    liberationmono: 'Courier New', cousine: 'Courier New', couriernew: 'Courier New', courier: 'Courier New',
    calibri: 'Calibri', cambria: 'Cambria', dejavusans: 'DejaVu Sans', opensymbol: 'Symbol', symbol: 'Symbol',
  };
  const key = family.toLowerCase().replace(/[\s_]/g, '');
  family = WORD[key] || family.replace(/([a-z])([A-Z])/g, '$1 $2');
  return { family, bold, italic };
}

// `pdfjs` is injected: src/node/pdfjs-node.js on the server, pdfjs-dist/build/pdf.mjs in browsers.
// `pdfOptions` adds getDocument() parameters such as cMapUrl/wasmUrl (CJK text, scanned-image decoders).
// `ocr` and `onProgress`: see convert() in ../index.js. Returns { pages, scannedPages, ocrPages }.
export async function extractPdf(bytes, { pdfjs, maxPages = Infinity, pdfOptions = {}, limits = DEFAULT_LIMITS, ocr, onProgress } = {}) {
  if (!pdfjs) throw new Error('extractPdf: pass { pdfjs } (see src/node/pdfjs-node.js)');
  // The Node adapter (node/pdfjs-node.js) provides a guard that keeps pdf.js-internal floating promises
  // from becoming process-level unhandled rejections; browsers don't need one.
  const guard = typeof pdfjs.runGuarded === 'function' ? pdfjs.runGuarded : (fn) => fn();
  return guard(() => extract(bytes, pdfjs, maxPages, pdfOptions, limits, ocr, onProgress));
}

/** the scan counts every PDF converter reports. sparseText: almost no text in the whole document (as before
 * OCR existed: scans, or text drawn as pictures or outlines). scannedLikely: scanned pages remain unread, or
 * sparseText. A caller deciding whether to send the file elsewhere can weigh scannedPages - ocrPages against
 * pages: one unread picture page in a document that was otherwise read is usually a photo or a title slide. */
export function scanStats({ pages, scannedPages, ocrPages }) {
  const glyphs = pages.reduce((a, p) => a + p.glyphs.length, 0);
  const sparseText = glyphs < pages.length * 20;
  return { scannedPages, ocrPages, sparseText, scannedLikely: scannedPages > ocrPages || sparseText };
}

async function extract(bytes, pdfjs, maxPages, pdfOptions, limits, ocr, onProgress) {
  const { runGuarded, ...opts } = pdfOptions || {};
  const task = pdfjs.getDocument({
    // pdf.js skips (does not decode) images above this many pixels; a 30000 x 30000 image would otherwise
    // be decoded to ~1 GB before we ever see it. pdfOptions.maxImageSize overrides it (-1 = no limit).
    maxImageSize: limits.maxPdfImagePixels,
    ...opts,
    // pdf.js transfers (detaches) the buffer it is given; hand it a copy so the caller's bytes stay usable
    data: new Uint8Array(bytes), fontExtraProperties: true, disableFontFace: true, useSystemFonts: false,
    isEvalSupported: false, isOffscreenCanvasSupported: false, isImageDecoderSupported: false,
    useWorkerFetch: false, verbosity: 0,
  });
  try {
    // inside the try: when loading fails the task must still be destroyed (it holds the worker-side document)
    const doc = await task.promise;
    if (doc.numPages > maxPages) throw new LimitError(`PDF has ${doc.numPages} pages; limit is ${maxPages}`);
    const pages = [];
    const imageCache = new Map(); // pdf.js object id -> encoded image, so a logo on every page is encoded once
    const scans = []; // scanned pages: { page (extracted), image, op, m }
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      pages.push(await extractPage(pdfjs, page, p, imageCache, limits, scans));
      page.cleanup(); // drop the operator list and decoded resources as soon as the page is done
    }
    let ocrPages = 0;
    if (typeof ocr === 'function') {
      // a second pass, so the number of pages to read is known for progress and only one page's pixels
      // are held at a time; skewed placements are not read
      const todo = scans.filter((s) => orientation(s.m)).slice(0, limits.maxOcrPages);
      for (let k = 0; k < todo.length; k++) {
        try { onProgress?.({ stage: 'ocr', page: k + 1, pages: todo.length }); } catch { /* the caller's problem */ }
        if (await readScan(pdfjs, doc, todo[k], ocr, k + 1, todo.length, limits)) ocrPages++;
      }
    }
    return { pages, scannedPages: scans.length, ocrPages };
  } finally {
    await task.destroy().catch(() => {}); // frees fonts/images held by pdf.js - important on warm serverless instances
  }
}

/** OCR one scanned page; on success its glyphs replace its picture. Never throws: false leaves the page as it is. */
async function readScan(pdfjs, doc, scan, ocr, k, n, limits) {
  let page = null;
  try {
    page = await doc.getPage(scan.page.pageNo);
    // the operator list is rebuilt the same way, so the image is at the same index; pdf.js decodes it again
    const ops = await page.getOperatorList();
    const fn = ops.fnArray[scan.op];
    const a = ops.argsArray[scan.op];
    let obj = null;
    if (fn === pdfjs.OPS.paintInlineImageXObject) obj = a[0];
    else if (fn === pdfjs.OPS.paintImageXObject) obj = await resolveObj(page, a[0]);
    const px = obj ? pixelsOf(obj, pdfjs, limits) : null;
    const img = px ? ocrImage(px, scan.m, limits.maxOcrImagePixels) : null;
    if (!img) return false;
    const result = await ocr({ bytes: img.bytes, format: img.format, width: img.width, height: img.height, page: k, pages: n });
    const glyphs = ocrGlyphs(result, img, scan.image);
    if (!glyphs) return false;
    for (const g of glyphs) scan.page.glyphs.push(g);
    scan.page.images.splice(scan.page.images.indexOf(scan.image), 1);
    scan.page.ocr = { top: scan.image.y0, bottom: scan.image.y1 }; // read by OCR; where the picture was (analyze.js)
    return true;
  } catch {
    return false; // the OCR function failed, or pdf.js could not read the page again
  } finally {
    page?.cleanup();
  }
}

// image objects are decoded asynchronously by pdf.js; use the callback form of objs.get
const resolveObj = (page, id) => new Promise((resolve) => {
  const store = id.startsWith('g_') ? page.commonObjs : page.objs;
  const timer = setTimeout(() => resolve(null), 5000);
  try { store.get(id, (v) => { clearTimeout(timer); resolve(v); }); } catch { clearTimeout(timer); resolve(null); }
});

async function extractPage(pdfjs, page, pageNo, imageCache = new Map(), limits = DEFAULT_LIMITS, scans = []) {
  const { OPS } = pdfjs;
  const vp = page.getViewport({ scale: 1 });
  const ops = await page.getOperatorList();
  const glyphs = [];
  const segs = []; // straight vector segments {x0,y0,x1,y1,w,color}
  const rects = []; // filled rectangles {x0,y0,x1,y1,color}
  const paths = []; // every painted path {d, fill, stroke, lw, evenOdd, z}
  let z = 0; // paint order across paths and images
  const images = [];
  const imageOps = []; // per image: operator index and transform (for OCR of scanned pages)
  let st = {
    ctm: vp.transform.slice(), fill: '#000000', stroke: '#000000', lw: 1, font: null, size: 0,
    tm: IDENT, x: 0, y: 0, lx: 0, ly: 0, cs: 0, ws: 0, hs: 1, tl: 0, rise: 0, mode: 0,
  };
  const stack = [];
  let artifact = 0;
  const mc = [];
  const fontInfo = new Map();
  const getFont = (id) => {
    if (!fontInfo.has(id)) {
      let f = null;
      try { f = page.commonObjs.get(id); } catch { f = null; }
      const parsed = parseFontName(f && f.name);
      // font metrics come from the file: damaged fonts give NaN/Infinity, which would poison every layout sum
      const fin = (v, d) => (Number.isFinite(v) && v !== 0 ? v : d);
      const fm = Array.isArray(f?.fontMatrix) && f.fontMatrix.length === 6 && f.fontMatrix.every(Number.isFinite) ? f.fontMatrix : [0.001, 0, 0, 0.001, 0, 0];
      fontInfo.set(id, { obj: f, ...parsed, ascent: fin(f?.ascent, 0.8), descent: fin(f?.descent, -0.2), fm });
    }
    return fontInfo.get(id);
  };
  const moveText = (x, y) => { st.lx += x; st.ly += y; st.x = st.lx; st.y = st.ly; };

  const showText = (arr) => {
    if (!st.font) return;
    const f = st.font;
    const M = mul(st.ctm, st.tm);
    const vScale = Math.hypot(M[2], M[3]);
    const rotated = Math.abs(M[1]) > 1e-3 || Math.abs(M[2]) > 1e-3;
    const sizeEff = st.size * vScale;
    for (const g of arr) {
      if (typeof g === 'number') { st.x -= (g * st.size / 1000) * st.hs; continue; }
      if (!g) continue;
      const adv = (g.width * f.fm[0] * st.size + st.cs + (g.isSpace ? st.ws : 0)) * st.hs;
      const [px, py] = apply(M, st.x, st.y + st.rise);
      const [qx, qy] = apply(M, st.x + g.width * f.fm[0] * st.size * st.hs, st.y + st.rise);
      const ch = g.unicode || '';
      // degenerate matrices/widths in damaged files give NaN or Infinity positions: drop such glyphs
      if (ch && st.mode !== 7 && Number.isFinite(px) && Number.isFinite(qx) && Number.isFinite(py) && Number.isFinite(sizeEff)) {
        glyphs.push({
          ch, x0: Math.min(px, qx), x1: Math.max(px, qx), y: py, size: sizeEff,
          family: f.family, bold: f.bold || (st.mode === 2 && true), italic: f.italic, fontRaw: f.obj?.name,
          ascent: f.ascent, descent: f.descent,
          // NB: pdf.js sets isSpace for char code 32, but subset fonts often map code 32 to a letter
          color: st.mode === 1 ? st.stroke : st.fill, space: ch === ' ' || ch === ' ',
          artifact: artifact > 0, invisible: st.mode === 3, rotated,
          // rotated text: origin on the baseline, baseline angle (degrees, y down) and advance along it
          ...(rotated ? { ox: px, oy: py, ang: (Math.atan2(M[1], M[0]) * 180) / Math.PI, adv: Math.hypot(qx - px, qy - py) } : {}),
        });
      }
      st.x += adv;
    }
  };

  const addPath = (paintOp, data) => {
    if (!data) return;
    const D = data instanceof Float32Array || Array.isArray(data) ? data : null;
    if (!D) return;
    const subpaths = [];
    let cur = null;
    for (let i = 0; i < D.length;) {
      const op = D[i++];
      if (op === 0) { cur = [apply(st.ctm, D[i], D[i + 1])]; subpaths.push(cur); i += 2; }
      else if (op === 1) { if (!cur) { cur = []; subpaths.push(cur); } cur.push(apply(st.ctm, D[i], D[i + 1])); i += 2; }
      else if (op === 2) { if (cur) cur.push(apply(st.ctm, D[i + 4], D[i + 5])), (cur.curved = true); i += 6; }
      else if (op === 3) { if (cur) cur.push(apply(st.ctm, D[i + 2], D[i + 3])), (cur.curved = true); i += 4; }
      else if (op === 4) { if (cur && cur.length) cur.closed = true; }
      else break;
    }
    const isFill = [OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke].includes(paintOp);
    const isStroke = [OPS.stroke, OPS.closeStroke, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke].includes(paintOp);
    if (!isFill && !isStroke) return; // clipping paths etc.
    const lwDev = st.lw * Math.hypot(st.ctm[0], st.ctm[1]) || 0.5;
    // the complete painted path (with curves) for converters that redraw vector graphics (PDF -> PowerPoint)
    if (paths.length < MAX_PATHS) {
      const d = [];
      for (let i = 0; i < D.length;) {
        const op = D[i++];
        if (op === 0) { d.push(['M', ...apply(st.ctm, D[i], D[i + 1])]); i += 2; }
        else if (op === 1) { d.push(['L', ...apply(st.ctm, D[i], D[i + 1])]); i += 2; }
        else if (op === 2) { d.push(['C', ...apply(st.ctm, D[i], D[i + 1]), ...apply(st.ctm, D[i + 2], D[i + 3]), ...apply(st.ctm, D[i + 4], D[i + 5])]); i += 6; }
        else if (op === 3) { d.push(['Q', ...apply(st.ctm, D[i], D[i + 1]), ...apply(st.ctm, D[i + 2], D[i + 3])]); i += 4; }
        else if (op === 4) d.push(['Z']);
        else break;
      }
      if (d.length > 1) {
        paths.push({
          z: z++, d, fill: isFill ? st.fill : null, stroke: isStroke ? st.stroke : null, lw: lwDev,
          evenOdd: [OPS.eoFill, OPS.eoFillStroke, OPS.closeEOFillStroke].includes(paintOp),
        });
      }
    }
    for (const sp of subpaths) {
      if (sp.curved || sp.length < 2) continue;
      const xs = sp.map((p) => p[0]);
      const ys = sp.map((p) => p[1]);
      const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
      const axisAligned = sp.every((p, k) => k === 0 || Math.abs(p[0] - sp[k - 1][0]) < 0.3 || Math.abs(p[1] - sp[k - 1][1]) < 0.3);
      if (isFill && sp.length >= 4 && axisAligned) {
        const w = box.x1 - box.x0;
        const h = box.y1 - box.y0;
        if (h < 2.2 && w > 2) segs.push({ x0: box.x0, x1: box.x1, y0: (box.y0 + box.y1) / 2, y1: (box.y0 + box.y1) / 2, w: h, color: st.fill, from: 'fill' });
        else if (w < 2.2 && h > 2) segs.push({ x0: (box.x0 + box.x1) / 2, x1: (box.x0 + box.x1) / 2, y0: box.y0, y1: box.y1, w, color: st.fill, from: 'fill' });
        else if (w >= 2.2 && h >= 2.2) rects.push({ ...box, color: st.fill });
      }
      if (isStroke) {
        const pts = sp.closed ? [...sp, sp[0]] : sp;
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1];
          const [bx, by] = pts[k];
          if (Math.abs(ay - by) < 0.3 || Math.abs(ax - bx) < 0.3) {
            segs.push({ x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: Math.min(ay, by), y1: Math.max(ay, by), w: lwDev, color: st.stroke, from: 'stroke' });
          }
        }
      }
    }
  };

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const a = ops.argsArray[i];
    switch (fn) {
      case OPS.save: stack.push({ ...st }); break;
      case OPS.restore: if (stack.length) st = stack.pop(); break;
      case OPS.transform: st.ctm = mul(st.ctm, a); break;
      case OPS.setLineWidth: st.lw = a[0]; break;
      case OPS.setFillRGBColor: st.fill = typeof a[0] === 'string' ? a[0] : rgbHex(a); break;
      case OPS.setStrokeRGBColor: st.stroke = typeof a[0] === 'string' ? a[0] : rgbHex(a); break;
      case OPS.setFillGray: st.fill = typeof a[0] === 'string' ? a[0] : rgbHex([a[0] * 255, a[0] * 255, a[0] * 255]); break;
      case OPS.setStrokeGray: st.stroke = typeof a[0] === 'string' ? a[0] : rgbHex([a[0] * 255, a[0] * 255, a[0] * 255]); break;
      case OPS.beginText: st.tm = IDENT; st.x = st.y = st.lx = st.ly = 0; break;
      case OPS.setCharSpacing: st.cs = a[0]; break;
      case OPS.setWordSpacing: st.ws = a[0]; break;
      case OPS.setHScale: st.hs = a[0] / 100; break;
      case OPS.setLeading: st.tl = a[0]; break;
      case OPS.setFont: st.font = getFont(a[0]); st.size = a[1]; break;
      case OPS.setTextRise: st.rise = a[0]; break;
      case OPS.setTextRenderingMode: st.mode = a[0]; break;
      case OPS.moveText: moveText(a[0], a[1]); break;
      case OPS.setLeadingMoveText: st.tl = -a[1]; moveText(a[0], a[1]); break;
      case OPS.setTextMatrix: {
        const m = a.length === 1 ? Array.from(a[0]) : Array.from(a);
        st.tm = m; st.x = st.y = st.lx = st.ly = 0;
        break;
      }
      case OPS.nextLine: moveText(0, -st.tl); break;
      case OPS.showText: case OPS.showSpacedText: showText(a[0]); break;
      case OPS.nextLineShowText: moveText(0, -st.tl); showText(a[0]); break;
      case OPS.nextLineSetSpacingShowText: st.ws = a[0]; st.cs = a[1]; moveText(0, -st.tl); showText(a[2]); break;
      case OPS.constructPath: addPath(a[0], a[1] && a[1][0]); break;
      case OPS.beginMarkedContent: case OPS.beginMarkedContentProps: {
        const tag = a && (a[0]?.name || a[0]);
        const isArt = tag === 'Artifact';
        mc.push(isArt);
        if (isArt) artifact++;
        break;
      }
      case OPS.endMarkedContent: if (mc.pop()) artifact--; break;
      case OPS.paintImageXObject: case OPS.paintInlineImageXObject: {
        const corners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => apply(st.ctm, x, y));
        const xs = corners.map((c) => c[0]);
        const ys = corners.map((c) => c[1]);
        if (![...xs, ...ys].every(Number.isFinite)) break; // degenerate transform: nowhere to place it
        images.push({
          z: z++, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), artifact: artifact > 0,
          inline: fn === OPS.paintInlineImageXObject ? a[0] : null, id: fn === OPS.paintImageXObject ? a[0] : null, png: null,
        });
        imageOps.push({ op: i, m: st.ctm });
        break;
      }
      default: break;
    }
  }
  for (const im of images) {
    const key = im.id && im.id.startsWith('g_') ? im.id : im.id ? `${pageNo}:${im.id}` : null;
    let enc = key ? imageCache.get(key) : undefined;
    if (enc === undefined) {
      const obj = im.inline || (im.id ? await resolveObj(page, im.id) : null);
      enc = obj ? encodeImage(obj, pdfjs, im.x1 - im.x0, im.y1 - im.y0, limits) : null;
      if (key) imageCache.set(key, enc);
    }
    im.png = enc?.data || null; // encoded bytes (PNG or JPEG, see im.format)
    im.format = enc?.format || null;
    delete im.inline;
  }
  const links = [];
  for (const an of await page.getAnnotations()) {
    if (an.subtype === 'Link' && an.url) {
      const [x0, y0] = apply(vp.transform, an.rect[0], an.rect[1]);
      const [x1, y1] = apply(vp.transform, an.rect[2], an.rect[3]);
      links.push({ url: an.url, x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1) });
    }
  }
  const out = { pageNo, width: vp.width, height: vp.height, glyphs, segs, rects, images, links, paths };
  const k = findScan(glyphs, images, vp.width, vp.height);
  if (k >= 0) scans.push({ page: out, image: images[k], ...imageOps[k] });
  return out;
}

function rgbHex([r, g, b]) {
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** decoded pdf.js image -> { pixels, width, height, channels } */
function pixelsOf(img, pdfjs, limits = DEFAULT_LIMITS) {
  const { width, height, data, kind } = img;
  // we allocate up to 4 bytes per pixel below (and the encoders more): skip absurd images
  const px = (w, h) => Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0 && w * h <= limits.maxImagePixels;
  if (!data && img.bitmap && typeof OffscreenCanvas !== 'undefined') {
    if (!px(img.bitmap.width, img.bitmap.height)) return null;
    // browsers: pdf.js hands over an ImageBitmap; read the pixels back through an OffscreenCanvas
    const c = new OffscreenCanvas(img.bitmap.width, img.bitmap.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(img.bitmap, 0, 0);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;
    return { pixels: new Uint8Array(px.buffer, px.byteOffset, px.length), width: c.width, height: c.height, channels: 4 };
  }
  if (!data || !px(width, height)) return null;
  const K = pdfjs.ImageKind;
  // a data array shorter than its stated size would make the encoders read past it
  const need = { [K.RGBA_32BPP]: width * height * 4, [K.RGB_24BPP]: width * height * 3, [K.GRAYSCALE_1BPP]: ((width + 7) >> 3) * height }[kind];
  if (need === undefined || data.length < need) return null;
  if (kind === K.RGBA_32BPP) return { pixels: new Uint8Array(data.buffer, data.byteOffset, data.length), width, height, channels: 4 };
  if (kind === K.RGB_24BPP) return { pixels: new Uint8Array(data.buffer, data.byteOffset, data.length), width, height, channels: 3 };
  if (kind === K.GRAYSCALE_1BPP) {
    const out = new Uint8Array(width * height);
    const rowBytes = (width + 7) >> 3;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      out[y * width + x] = (data[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0;
    }
    return { pixels: out, width, height, channels: 1 };
  }
  return null;
}

/** box-filter downscale by an integer factor */
function shrink({ pixels, width, height, channels }, f) {
  const w = Math.max(1, Math.floor(width / f));
  const h = Math.max(1, Math.floor(height / f));
  const out = new Uint8Array(w * h * channels);
  const acc = new Float64Array(channels);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      acc.fill(0);
      for (let dy = 0; dy < f; dy++) {
        const row = ((y * f + dy) * width + x * f) * channels;
        for (let dx = 0; dx < f * channels; dx++) acc[dx % channels] += pixels[row + dx];
      }
      for (let c = 0; c < channels; c++) out[(y * w + x) * channels + c] = acc[c] / (f * f);
    }
  }
  return { pixels: out, width: w, height: h, channels };
}

/**
 * Re-encode an extracted image for embedding: downsample to about 220 dpi at its displayed size, then JPEG for
 * opaque photographic content (gradients, photos) and PNG for everything else (transparency, flat graphics, text).
 */
function encodeImage(img, pdfjs, dispW, dispH, limits) {
  let px = pixelsOf(img, pdfjs, limits);
  if (!px) return null;
  // display size comes from the page's transform: NaN/Infinity (degenerate matrices) -> no downscale
  const f = Math.floor(Math.min(px.width / Math.max(64, (dispW * 220) / 72), px.height / Math.max(64, (dispH * 220) / 72))) || 1;
  if (f >= 2) px = shrink(px, f);
  const { pixels, width, height, channels } = px;
  let transparent = false;
  if (channels === 4) for (let i = 3; i < pixels.length; i += 4) if (pixels[i] < 250) { transparent = true; break; }
  if (!transparent && width * height >= 4096) {
    const colors = new Set();
    const step = Math.max(1, Math.floor((width * height) / 6000));
    for (let p = 0; p < width * height && colors.size <= 600; p += step) {
      const i = p * channels;
      colors.add(channels >= 3 ? (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2] : pixels[i]);
    }
    if (colors.size > 600) {
      const jpg = encodeJpeg(width, height, pixels, channels, 85);
      if (width * height > 1e6) return { data: jpg, format: 'jpg' };
      // anti-aliased graphics also have many colours: keep JPEG only where it clearly wins
      const png = encodePng(width, height, pixels, channels);
      return jpg.length < png.length * 0.7 ? { data: jpg, format: 'jpg' } : { data: png, format: 'png' };
    }
  }
  return { data: encodePng(width, height, pixels, channels), format: 'png' };
}
