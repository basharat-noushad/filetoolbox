// Display list -> PDF bytes with pdfkit (Node build on the server, browser build in browsers).
//
// Item kinds (all coordinates in points, origin top-left):
//   rect  {x,y,w,h, fill, stroke?, lw?, opacity?}
//   line  {x1,y1,x2,y2, w, color, dash?}
//   text  {x,y(baseline), text, rec, size, color, cs?, link?, clip?{x,y,w,h}}
//   img   {x,y,w,h, data, format, clip?}
//   shape {kind: rect|roundRect|ellipse|polygon, x,y,w,h, r?, points?, fill?, stroke?, lw?, opacity?}
//   path  {d: [['M',x,y],['L',x,y],['C',x1,y1,x2,y2,x,y],['Q',x1,y1,x,y],['Z']], fill?, stroke?, lw?, dash?,
//          opacity? (fill), strokeOpacity?, cap?, join?, evenOdd?, box? (gradient frame; defaults to the path bounds)}
//   group {items, rot? (degrees), cx?, cy?, clip? {x,y,w,h}, clipPath? (path commands), flipH?, flipV?}
// Fills may be a colour or a gradient: {type:'linear', angle, stops:[[pos, colour, opacity?]]} or
// {type:'radial', cx, cy (0..1 of the box), stops}.
// A page is drawn in z-order when page.ordered is set (slides); otherwise fills, images, text and
// rules are layered so shading never covers text (documents, sheets).
import PDFDocument from 'pdfkit';
import { pngIsSafe } from './png.js';
import { DEFAULT_LIMITS } from './limits.js';

const LAYER = { rect: 0, shape: 0, path: 0, img: 1, text: 2, line: 3, group: 2 };

export function renderPdf(layout, fonts, meta = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      // font: null -> no standard Helvetica; the browser build doesn't ship AFM data and we only use embedded fonts
      autoFirstPage: false, margin: 0, compress: true, pdfVersion: '1.7', font: null,
      info: { Title: meta.title || 'Document', Creator: 'doc-convert', Producer: 'doc-convert + pdfkit' },
    });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('error', reject);
    doc.on('end', () => {
      const len = chunks.reduce((a, c) => a + c.length, 0);
      const out = new Uint8Array(len);
      let o = 0;
      for (const c of chunks) { out.set(c, o); o += c.length; }
      resolve(out);
    });
    // the page loop below is synchronous, so a module-level "limits of the current render" is safe
    renderLimits = meta.limits || DEFAULT_LIMITS;
    try {
      fonts.register(doc);
      for (const page of layout.pages) {
        doc.addPage({ size: [page.width || layout.width, page.height || layout.height], margin: 0 });
        let items = page.items;
        if (!page.ordered) {
          const layers = [[], [], [], []];
          for (const it of items) layers[LAYER[it.t] ?? 2].push(it);
          items = layers.flat();
        }
        for (const it of items) draw(doc, it);
      }
      doc.end();
    } catch (e) {
      reject(e);
    } finally {
      renderLimits = DEFAULT_LIMITS;
    }
  });
}

function withClip(doc, clip, fn) {
  if (!clip) return fn();
  doc.save();
  doc.rect(clip.x, clip.y, clip.w, clip.h).clip();
  fn();
  doc.restore();
}

const COORDS = ['x', 'y', 'w', 'h', 'x1', 'y1', 'x2', 'y2', 'size', 'cx', 'cy'];
/** one bad number (NaN from a degenerate shape or chart) must not abort the whole document */
function finite(it) {
  for (const k of COORDS) if (k in it && it[k] !== undefined && !Number.isFinite(it[k])) return false;
  if (it.d) for (const c of it.d) for (let i = 1; i < c.length; i++) if (!Number.isFinite(c[i])) return false;
  if (it.points) for (const p of it.points) if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) return false;
  return true;
}

function draw(doc, it) {
  if (!finite(it)) return;
  switch (it.t) {
    case 'rect': {
      doc.save();
      if (it.opacity != null) doc.fillOpacity(it.opacity);
      doc.rect(it.x, it.y, it.w, it.h);
      if (it.fill && it.stroke) doc.lineWidth(it.lw || 0.5).fillAndStroke(paint(doc, it.fill, it), it.stroke);
      else if (it.fill) doc.fill(paint(doc, it.fill, it));
      else if (it.stroke) doc.lineWidth(it.lw || 0.5).stroke(it.stroke);
      doc.restore();
      break;
    }
    case 'line':
      doc.save().lineWidth(it.w).strokeColor(it.color);
      if (it.opacity != null) doc.strokeOpacity(it.opacity);
      setDash(doc, it.dash);
      if (it.cap) doc.lineCap(it.cap);
      doc.moveTo(it.x1, it.y1).lineTo(it.x2, it.y2).stroke().restore();
      break;
    case 'path':
      drawPath(doc, it);
      break;
    case 'text':
      withClip(doc, it.clip, () => drawText(doc, it));
      break;
    case 'img':
      withClip(doc, it.clip, () => drawImage(doc, it));
      break;
    case 'shape':
      drawShape(doc, it);
      break;
    case 'group':
      doc.save();
      if (it.rot) doc.rotate(it.rot, { origin: [it.cx, it.cy] });
      if (it.flipH || it.flipV) doc.transform(it.flipH ? -1 : 1, 0, 0, it.flipV ? -1 : 1, it.flipH ? 2 * it.cx : 0, it.flipV ? 2 * it.cy : 0);
      if (it.clip) doc.rect(it.clip.x, it.clip.y, it.clip.w, it.clip.h).clip();
      if (it.clipPath) { tracePath(doc, it.clipPath); doc.clip(); }
      for (const c of it.items) draw(doc, c);
      doc.restore();
      break;
    default:
      break;
  }
}

function setDash(doc, dash) {
  if (dash && dash.length && dash.every((v) => Number.isFinite(v) && v > 0)) doc.dash(dash.length === 2 ? dash[0] : dash, dash.length === 2 ? { space: dash[1] } : {});
}

function tracePath(doc, d) {
  for (const c of d) {
    if (c[0] === 'M') doc.moveTo(c[1], c[2]);
    else if (c[0] === 'L') doc.lineTo(c[1], c[2]);
    else if (c[0] === 'C') doc.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]);
    else if (c[0] === 'Q') doc.quadraticCurveTo(c[1], c[2], c[3], c[4]);
    else if (c[0] === 'Z') doc.closePath();
  }
}

export function pathBounds(d) {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const c of d) for (let i = 1; i + 1 < c.length; i += 2) {
    x0 = Math.min(x0, c[i]); x1 = Math.max(x1, c[i]); y0 = Math.min(y0, c[i + 1]); y1 = Math.max(y1, c[i + 1]);
  }
  return Number.isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : { x: 0, y: 0, w: 0, h: 0 };
}

// fill: colour string, or a gradient {type: 'linear', angle (deg, 0 = left->right, 90 = top->bottom) | type: 'radial', cx, cy; stops: [[pos 0..1, colour, opacity?]]}
function paint(doc, fill, box) {
  if (!fill || typeof fill === 'string') return fill;
  let g;
  if (fill.type === 'radial') {
    const cx = box.x + box.w * (fill.cx ?? 0.5);
    const cy = box.y + box.h * (fill.cy ?? 0.5);
    const r = Math.max(...[[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]].map(([x, y]) => Math.hypot(x - cx, y - cy)), 1);
    g = doc.radialGradient(cx, cy, 0, cx, cy, r);
  } else {
    const a = ((fill.angle || 0) * Math.PI) / 180;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const r = (Math.abs(Math.cos(a)) * box.w + Math.abs(Math.sin(a)) * box.h) / 2 || 1;
    g = doc.linearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  const stops = fill.stops.filter((st) => typeof st[1] === 'string' && Number.isFinite(st[0]));
  if (!stops.length) return null;
  for (const [pos, color, op] of stops) g.stop(Math.max(0, Math.min(1, pos)), color, op ?? 1);
  return g;
}

function drawPath(doc, it) {
  if ((!it.fill && !it.stroke) || !it.d?.length) return;
  doc.save();
  if (it.opacity != null) doc.fillOpacity(it.opacity);
  if (it.strokeOpacity != null) doc.strokeOpacity(it.strokeOpacity);
  tracePath(doc, it.d);
  if (it.lw) doc.lineWidth(it.lw);
  setDash(doc, it.dash);
  if (it.cap) doc.lineCap(it.cap);
  if (it.join) doc.lineJoin(it.join);
  const fill = paint(doc, it.fill, it.box || pathBounds(it.d));
  const rule = it.evenOdd ? 'even-odd' : 'non-zero';
  if (fill && it.stroke) doc.fillAndStroke(fill, it.stroke, rule);
  else if (fill) doc.fill(fill, rule);
  else doc.stroke(it.stroke);
  doc.restore();
}

function drawShape(doc, it) {
  if (!it.fill && !it.stroke) return;
  doc.save();
  if (it.opacity != null) { doc.fillOpacity(it.opacity); doc.strokeOpacity(it.opacity); }
  if (it.kind === 'ellipse') doc.ellipse(it.x + it.w / 2, it.y + it.h / 2, it.w / 2, it.h / 2);
  else if (it.kind === 'roundRect') doc.roundedRect(it.x, it.y, it.w, it.h, Math.min(it.r || 6, it.w / 2, it.h / 2));
  else if (it.kind === 'polygon' && it.points?.length > 2) doc.polygon(...it.points);
  else doc.rect(it.x, it.y, it.w, it.h);
  if (it.lw) doc.lineWidth(it.lw);
  setDash(doc, it.dash);
  const fill = paint(doc, it.fill, it.points ? pathBounds([['M', ...it.points.flat()]]) : it);
  if (fill && it.stroke) doc.fillAndStroke(fill, it.stroke);
  else if (fill) doc.fill(fill);
  else doc.stroke(it.stroke);
  doc.restore();
}

let renderLimits = DEFAULT_LIMITS;
const SAFE = new WeakMap(); // image bytes -> verdict, so a picture repeated on every slide is checked once
function imageOk(it) {
  if (it.format !== 'png') return it.format === 'jpg' || it.format === 'jpeg';
  if (!(it.data instanceof Uint8Array)) return false;
  if (!SAFE.has(it.data)) SAFE.set(it.data, pngIsSafe(it.data, renderLimits));
  return SAFE.get(it.data);
}

function drawImage(doc, it) {
  const ok = imageOk(it);
  if (ok) {
    try {
      if (it.opacity != null) { doc.save(); doc.fillOpacity(it.opacity); }
      doc.image(it.data, it.x, it.y, { width: it.w, height: it.h });
      if (it.opacity != null) doc.restore();
      return;
    } catch { /* fall through to placeholder */ }
  }
  // EMF/WMF/GIF/TIFF/SVG need a decoder or rasteriser (future work) - draw a placeholder box.
  doc.save().rect(it.x, it.y, it.w, it.h).lineWidth(0.5).fillAndStroke('#F2F2F2', '#BFBFBF').restore();
}

function drawText(doc, it) {
  doc.save();
  doc.font(it.rec.id).fontSize(it.size).fillColor(it.color || '#000000');
  if (it.opacity != null) doc.fillOpacity(it.opacity);
  const opts = { lineBreak: false, baseline: 'alphabetic', characterSpacing: it.cs || 0 };
  if (it.link && /^(https?:|mailto:)/i.test(it.link)) opts.link = it.link;
  if (it.rec.fakeItalic) doc.transform(1, 0, -0.2, 1, 0.2 * it.y, 0);
  if (it.rec.fakeBold) {
    doc.lineWidth(it.size * 0.03).strokeColor(it.color || '#000000');
    opts.stroke = true;
    opts.fill = true;
  }
  doc.text(it.text, it.x, it.y, opts);
  doc.restore();
}
