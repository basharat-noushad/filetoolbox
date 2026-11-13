// PowerPoint 97-2003 (.ppt) reader. Follows the current user / user edit / persist directory chain to the
// document and its slides, then reads each slide's drawing (OfficeArt): shape positions and types, fill and
// line colours, text boxes with their character and paragraph runs, and pictures (JPEG/PNG, DIB converted to
// PNG) from the Pictures stream. Master slide shapes are drawn under the slide's own. The result is the same
// scene the .pptx renderer draws. Not read: metafile (EMF/WMF) pictures, charts/OLE content, animations.
import CFB from 'cfb';
import { DEFAULT_LIMITS, LimitError, DamagedError, clampInt } from '../common/limits.js';
import { checkOle } from '../common/ole.js';
import { presetGeometry } from '../pptx2pdf/geom.js';
import { encodePng } from '../common/png.js';

const u16 = (b, p) => b[p] | (b[p + 1] << 8);
const i16 = (b, p) => (u16(b, p) << 16) >> 16;
const u32 = (b, p) => (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0;
const i32 = (b, p) => b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24);
const MU = 1 / 8; // master units (576 per inch) -> points

function* children(b, start, end) {
  let p = start;
  while (p + 8 <= end) {
    const verInst = u16(b, p);
    const type = u16(b, p + 2);
    const len = u32(b, p + 4);
    const dataEnd = Math.min(end, p + 8 + len);
    yield { ver: verInst & 0xf, inst: verInst >> 4, type, p: p + 8, end: dataEnd };
    p = dataEnd;
  }
}
const first = (b, rec, type) => { for (const c of children(b, rec.p, rec.end)) if (c.type === type) return c; return null; };
const all = (b, rec, type) => { const out = []; for (const c of children(b, rec.p, rec.end)) if (c.type === type) out.push(c); return out; };

// OfficeArt shape types -> DrawingML presets
const SHAPES = {
  1: 'rect', 2: 'roundRect', 3: 'ellipse', 4: 'diamond', 5: 'triangle', 6: 'rtTriangle', 7: 'parallelogram', 8: 'trapezoid', 9: 'hexagon', 10: 'octagon',
  11: 'plus', 12: 'star5', 13: 'rightArrow', 15: 'homePlate', 16: 'cube', 20: 'line', 22: 'can', 23: 'donut', 32: 'straightConnector1',
  55: 'chevron', 56: 'pentagon', 66: 'leftArrow', 67: 'downArrow', 68: 'upArrow', 69: 'leftRightArrow', 70: 'upDownArrow', 109: 'flowChartProcess',
  110: 'flowChartDecision', 111: 'flowChartInputOutput', 112: 'flowChartPredefinedProcess', 116: 'flowChartTerminator', 120: 'flowChartConnector',
  176: 'flowChartAlternateProcess', 61: 'wedgeRectCallout', 62: 'wedgeRoundRectCallout', 63: 'wedgeEllipseCallout', 202: 'rect', 75: 'rect', 0: 'rect',
};

/** OfficeArtCOLORREF -> '#RRGGBB' (scheme indices resolved against the slide's colour scheme) */
function colorRef(v, scheme) {
  const r = v & 0xff;
  const g = (v >> 8) & 0xff;
  const b = (v >> 16) & 0xff;
  const flags = (v >>> 24) & 0xff;
  if (flags & 0x08) return scheme[r] || '#000000';
  if (flags & 0x10) return null; // system colour: let the default apply
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** ColorIndexStruct (text colours): index 0xFE means RGB, 0-7 a colour scheme slot */
function textColor(v, scheme) {
  const idx = (v >>> 24) & 0xff;
  if (idx === 0xfe) return '#' + [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  return scheme[idx] || null;
}

/** OfficeArtFOPT -> { id: value } (complex data is attached as .complex) */
function props(b, rec) {
  const out = {};
  if (!rec) return out;
  const n = rec.inst;
  let cp = rec.p + n * 6;
  for (let i = 0; i < n; i++) {
    const q = rec.p + i * 6;
    const opid = u16(b, q);
    const id = opid & 0x3fff;
    const val = u32(b, q + 2);
    if (opid & 0x8000) { out[id] = { complex: b.subarray(cp, cp + val) }; cp += val; } else out[id] = val;
  }
  return out;
}

/** TextPFException fields (after its 4-byte mask m) starting at p -> [props, next p] */
function parsePF(b, p, m) {
  const run = {};
  if (m & 0x0f) { const f = u16(b, p); if (m & 1) run.bulletOn = !!(f & 1); p += 2; }
  if (m & 0x80) { run.bulletChar = String.fromCharCode(u16(b, p)); p += 2; }
  if (m & 0x10) { run.bulletFont = u16(b, p); p += 2; }
  if (m & 0x40) { run.bulletSize = i16(b, p); p += 2; }
  if (m & 0x20) { run.bulletColor = u32(b, p); p += 4; }
  if (m & 0x800) { run.align = u16(b, p); p += 2; }
  if (m & 0x1000) { run.lineSpacing = i16(b, p); p += 2; }
  if (m & 0x2000) { run.before = i16(b, p); p += 2; }
  if (m & 0x4000) { run.after = i16(b, p); p += 2; }
  if (m & 0x100) { run.left = u16(b, p); p += 2; }
  if (m & 0x400) { run.indentPos = u16(b, p); p += 2; }
  if (m & 0x8000) p += 2;
  if (m & 0x100000) { const n = u16(b, p); p += 2 + n * 4; }
  if (m & 0x10000) p += 2;
  if (m & 0xe0000) p += 2;
  if (m & 0x200000) p += 2;
  if (m & 0x800000) p += 2;
  if (m & 0x1000000) p += 4;
  return [run, p];
}
/** TextCFException fields (after its 4-byte mask m) starting at p -> [props, next p] */
function parseCF(b, p, m) {
  const run = {};
  if (m & 0x3fff) { const s = u16(b, p); p += 2; if (m & 1) run.bold = !!(s & 1); if (m & 2) run.italic = !!(s & 2); if (m & 4) run.underline = !!(s & 4); }
  if (m & 0x10000) { run.font = u16(b, p); p += 2; }
  if (m & 0x200000) p += 2;
  if (m & 0x400000) p += 2;
  if (m & 0x800000) { run.symbolFont = u16(b, p); p += 2; }
  if (m & 0x20000) { run.size = u16(b, p); p += 2; }
  if (m & 0x40000) { run.color = u32(b, p); p += 4; }
  if (m & 0x80000) { run.position = i16(b, p); p += 2; }
  if (m & 0x100000) p += 4;
  if (m & 0x1000000) p += 2;
  if (m & 0x2000000) p += 2;
  if (m & 0x4000000) p += 4;
  return [run, p];
}

/** StyleTextPropAtom -> paragraph runs and character runs */
function styleRuns(b, rec, textLen) {
  const pf = [];
  const cf = [];
  if (!rec) return { pf, cf };
  let p = rec.p;
  let left = textLen + 1;
  while (left > 0 && p + 10 <= rec.end) {
    const count = u32(b, p);
    const indent = u16(b, p + 4);
    const [run, q] = parsePF(b, p + 10, u32(b, p + 6));
    p = q;
    pf.push({ ...run, count, indent });
    left -= count;
  }
  left = textLen + 1;
  while (left > 0 && p + 8 <= rec.end) {
    const count = u32(b, p);
    const [run, q] = parseCF(b, p + 8, u32(b, p + 4));
    p = q;
    cf.push({ ...run, count });
    left -= count;
  }
  return { pf, cf };
}

/** TextMasterStyleAtom -> { [textType]: [{ pf, cf } per level] } */
function masterStyles(b, master) {
  const out = {};
  if (!master) return out;
  for (const c of children(b, master.p, master.end)) {
    if (c.type !== 0x0fa3) continue;
    const levels = [];
    let p = c.p;
    const n = u16(b, p);
    p += 2;
    for (let i = 0; i < n && p + 8 <= c.end; i++) {
      if (c.inst >= 5) p += 2;
      const [pf, q] = parsePF(b, p + 4, u32(b, p));
      const [cf, r] = parseCF(b, q + 4, u32(b, q));
      p = r;
      levels.push({ pf, cf });
    }
    // levels inherit from the level above
    for (let i = 1; i < levels.length; i++) levels[i] = { pf: { ...levels[i - 1].pf, ...levels[i].pf }, cf: { ...levels[i - 1].cf, ...levels[i].cf } };
    out[c.inst] = levels;
  }
  return out;
}

/** DIB (BITMAPINFOHEADER + pixels, as stored in .ppt) -> PNG bytes */
function dibToPng(d) {
  const hs = u32(d, 0);
  const w = i32(d, 4);
  const h0 = i32(d, 8);
  const bpp = u16(d, 14);
  const comp = u32(d, 16);
  if (comp !== 0 || w <= 0 || !h0 || w * Math.abs(h0) > 40e6 || ![1, 4, 8, 24, 32].includes(bpp)) return null;
  const h = Math.abs(h0);
  const ncol = Math.min(u32(d, 32) || (bpp <= 8 ? 1 << bpp : 0), 256);
  const pal = hs;
  const px = pal + ncol * 4;
  const stride = Math.ceil((w * bpp) / 32) * 4;
  if (px + stride * (h - 1) + Math.ceil((w * bpp) / 8) > d.length) return null; // truncated pixel data
  const out = new Uint8Array(w * h * 3);
  // bytes are written directly (no per-pixel temporary array: a 40 MP bitmap made 40 million of them)
  const step = bpp / 8;
  const mask = (1 << bpp) - 1;
  for (let y = 0; y < h; y++) {
    const row = px + (h0 > 0 ? h - 1 - y : y) * stride;
    let o = y * w * 3;
    for (let x = 0; x < w; x++, o += 3) {
      if (bpp >= 24) {
        const s = row + x * step;
        out[o] = d[s + 2]; out[o + 1] = d[s + 1]; out[o + 2] = d[s];
      } else {
        const bit = x * bpp;
        const q = pal + ((d[row + (bit >> 3)] >> (8 - bpp - (bit & 7))) & mask) * 4;
        out[o] = d[q + 2]; out[o + 1] = d[q + 1]; out[o + 2] = d[q];
      }
    }
  }
  return encodePng(w, h, out, 3);
}

export function loadPpt(bytes, { limits = DEFAULT_LIMITS } = {}) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  checkOle(u8, limits); // shared-sector amplification (see common/ole.js)
  let cfb;
  try { cfb = CFB.read(u8, { type: 'array' }); } catch { throw new Error('Not a readable PowerPoint 97-2003 file'); }
  const stream = (n) => { const e = CFB.find(cfb, n); return e?.content ? (e.content instanceof Uint8Array ? e.content : new Uint8Array(e.content)) : null; };
  const D = stream('PowerPoint Document');
  if (!D) throw new Error('Not a PowerPoint 97-2003 presentation');
  const cu = stream('Current User');
  if (cu && u32(cu, 12) === 0xf3d1c4df) throw new Error('This .ppt file is password-protected');
  const pics = stream('Pictures');

  // persist directory: newest edit wins
  const persist = new Map();
  let edit = cu ? u32(cu, 16) : -1;
  const seen = new Set();
  let docRef = null;
  while (edit >= 0 && edit + 32 <= D.length && !seen.has(edit) && u16(D, edit + 2) === 0x0ff5) {
    seen.add(edit);
    const e = edit + 8;
    if (docRef == null) docRef = u32(D, e + 16);
    const dir = u32(D, e + 12);
    if (dir + 8 <= D.length) {
      const end = Math.min(D.length, dir + 8 + u32(D, dir + 4)); // a damaged length must not run past the stream
      let p = dir + 8;
      while (p + 4 <= end) {
        const w = u32(D, p);
        const id0 = w & 0xfffff;
        const n = w >>> 20;
        p += 4;
        for (let i = 0; i < n && p + 4 <= end; i++, p += 4) if (!persist.has(id0 + i)) persist.set(id0 + i, u32(D, p));
      }
    }
    const prev = u32(D, e + 8);
    edit = prev ? prev : -1;
  }
  const atPersist = (id) => {
    const off = persist.get(id);
    if (off == null || off + 8 > D.length) return null;
    return { ver: u16(D, off) & 0xf, inst: u16(D, off) >> 4, type: u16(D, off + 2), p: off + 8, end: Math.min(D.length, off + 8 + u32(D, off + 4)) };
  };
  let doc = docRef != null ? atPersist(docRef) : null;
  if (!doc || doc.type !== 0x03e8) {
    // no usable edit chain: fall back to the first Document container in the stream
    for (const r of children(D, 0, D.length)) if (r.type === 0x03e8) { doc = r; break; }
  }
  if (!doc) throw new Error('No slides found in this .ppt file');

  const docAtom = first(D, doc, 0x03e9);
  const width = docAtom ? i32(D, docAtom.p) * MU : 720;
  const height = docAtom ? i32(D, docAtom.p + 4) * MU : 540;
  // fonts
  const fonts = [];
  const env = first(D, doc, 0x03f2);
  const fc = env && first(D, env, 0x07d5);
  if (fc) for (const f of all(D, fc, 0x0fb7)) { let s = ''; for (let k = 0; k < 32; k++) { const c = u16(D, f.p + k * 2); if (!c) break; s += String.fromCharCode(c); } fonts.push(s || 'Arial'); }
  // pictures: blip store in the document's drawing group
  const blips = [];
  const dg = first(D, doc, 0x040b);
  const dgg = dg && first(D, dg, 0xf000);
  const bstore = dgg && first(D, dgg, 0xf001);
  if (bstore) {
    for (const fbse of all(D, bstore, 0xf007)) {
      const size = u32(D, fbse.p + 20);
      const off = u32(D, fbse.p + 28);
      let src = null;
      let at = 0;
      if (pics && off + 8 <= pics.length) { src = pics; at = off; } else if (fbse.end - fbse.p > 36) { src = D; at = fbse.p + 36 + D[fbse.p + 33]; }
      blips.push(src ? decodeBlip(src, at, size) : null);
    }
  }
  // slides in order (SlideListWithText instance 0)
  const slides = [];
  const masters = new Map(); // master slideId -> persist id
  for (const slwt of all(D, doc, 0x0ff0)) {
    if (slwt.inst === 1) { for (const mpa of all(D, slwt, 0x03f3)) masters.set(u32(D, mpa.p + 12), u32(D, mpa.p)); continue; }
    if (slwt.inst !== 0) continue;
    let cur = null;
    for (const c of children(D, slwt.p, slwt.end)) {
      if (c.type === 0x03f3) { cur = { ref: u32(D, c.p), texts: [] }; slides.push(cur); } else if (!cur) continue;
      else if (c.type === 0x0f9f) cur.texts.push({ kind: u32(D, c.p), str: '', style: null });
      else if (c.type === 0x0fa0 || c.type === 0x0fa8) { const t = cur.texts[cur.texts.length - 1]; if (t) t.str = readText(D, c); } else if (c.type === 0x0fa1) { const t = cur.texts[cur.texts.length - 1]; if (t) t.style = c; }
    }
  }
  const model = { width, height, firstNum: 1, slides: [], fonts };
  for (const s of slides) {
    const rec = atPersist(s.ref);
    if (!rec || rec.type !== 0x03ee) continue;
    model.slides.push({ rec, texts: s.texts, hidden: false });
  }
  const masterOf = (id) => { const ref = masters.get(id); return ref != null ? atPersist(ref) : null; };
  model.build = (s, no) => buildScene(D, s.rec, { width, height, fonts, blips, atPersist, masterOf, slideNo: no, texts: s.texts });
  return model;
}

function readText(D, c) {
  let str = '';
  if (c.type === 0x0fa0) for (let p = c.p; p + 1 < c.end; p += 2) str += String.fromCharCode(u16(D, p));
  else for (let p = c.p; p < c.end; p++) str += String.fromCharCode(D[p]);
  return str;
}

function decodeBlip(src, at, size) {
  if (at + 8 > src.length) return null;
  const inst = u16(src, at) >> 4;
  const type = u16(src, at + 2);
  const len = u32(src, at + 4);
  const p = at + 8;
  const end = Math.min(src.length, p + len);
  const two = (base) => (inst === base + 1 ? 32 : 16);
  if (type === 0xf01d) return { data: src.slice(p + two(inst & 1 ? inst - 1 : inst) + 1, end), format: 'jpg' }; // JPEG
  if (type === 0xf02a) return { data: src.slice(p + (inst === 0x6e5 ? 32 : 16) + 1, end), format: 'jpg' }; // CMYK JPEG (approximate)
  if (type === 0xf01e) return { data: src.slice(p + (inst === 0x6e1 ? 32 : 16) + 1, end), format: 'png' };
  if (type === 0xf01f) { const png = dibToPng(src.subarray(p + (inst === 0x7a9 ? 32 : 16) + 1, end)); return png ? { data: png, format: 'png' } : null; }
  return { data: null, format: 'unsupported' };
}

/** OfficeArt fill properties -> scene fill ({color} | {grad} | {img}) or null */
function fillOf(fopt, scheme, blips, filledDefault) {
  const fb = fopt[0x01bf];
  const filled = typeof fb === 'number' && fb & 0x100000 ? !!(fb & 0x10) : filledDefault;
  if (!filled) return null;
  const type = typeof fopt[0x0180] === 'number' ? fopt[0x0180] : 0;
  const c1 = (typeof fopt[0x0181] === 'number' ? colorRef(fopt[0x0181], scheme) : null) || '#FFFFFF';
  const c2 = (typeof fopt[0x0183] === 'number' ? colorRef(fopt[0x0183], scheme) : null) || '#FFFFFF';
  const alpha = typeof fopt[0x0182] === 'number' ? Math.max(0, Math.min(1, fopt[0x0182] / 65536)) : 1;
  if ((type === 2 || type === 3) && typeof fopt[0x0186] === 'number' && blips[fopt[0x0186] - 1]?.data) {
    const im = blips[fopt[0x0186] - 1];
    return { img: { data: im.data, format: im.format, alpha: 1, tile: null }, color: c1, alpha: 1 };
  }
  if (type >= 4 && type <= 8) {
    const ang = typeof fopt[0x018b] === 'number' ? (fopt[0x018b] | 0) / 65536 : 0;
    const focus = typeof fopt[0x018c] === 'number' ? fopt[0x018c] | 0 : 0;
    // OfficeArt: angle 0 runs top -> bottom; focus 100 swaps the colours, 50 mirrors them in the middle
    const stops = Math.abs(focus) === 50 ? [[0, c2, 1], [0.5, c1, 1], [1, c2, 1]] : focus === 100 || focus === -100 ? [[0, c2, 1], [1, c1, 1]] : [[0, c1, 1], [1, c2, 1]];
    if (type === 5 || type === 6) return { grad: { type: 'radial', cx: 0.5, cy: 0.5, stops: stops.slice().reverse() }, color: c1, alpha };
    return { grad: { type: 'linear', angle: 90 - ang, stops }, color: c1, alpha };
  }
  return c1 ? { color: c1, alpha } : null;
}

function buildScene(D, slideRec, ctx) {
  const scheme = ['#FFFFFF', '#000000', '#808080', '#000000', '#BBE0E3', '#333399', '#009999', '#99CC00'];
  const readScheme = (rec) => {
    const cs = rec && first(D, rec, 0x07f0);
    if (cs) for (let i = 0; i < 8; i++) scheme[i] = colorRef(u32(D, cs.p + i * 4) & 0xffffff, scheme);
  };
  const atom = first(D, slideRec, 0x03ef);
  const masterId = atom ? u32(D, atom.p + 12) : 0;
  const flags = atom ? u16(D, atom.p + 20) : 7;
  const master = masterId ? ctx.masterOf(masterId) : null;
  // a title master is a slide whose own master is the main master (which holds the text styles)
  const tmAtom = master?.type === 0x03ee ? first(D, master, 0x03ef) : null;
  const main = tmAtom ? ctx.masterOf(u32(D, tmAtom.p + 12)) || master : master;
  readScheme(main);
  if (main !== master) readScheme(master);
  if (!(flags & 2) || !master) readScheme(slideRec); // fMasterScheme: the slide follows the master's colours
  const styles = masterStyles(D, main);
  const nodes = [];
  const bgOf = (rec) => {
    const ppd = rec && first(D, rec, 0x040c);
    const dgc = ppd && first(D, ppd, 0xf002);
    const bgSp = dgc && first(D, dgc, 0xf004);
    return bgSp ? fillOf(props(D, first(D, bgSp, 0xf00b)), scheme, ctx.blips, true) : null;
  };
  // fMasterBackground: the slide uses the master's background
  const bg = ((flags & 4) && master ? bgOf(master) || bgOf(main) : bgOf(slideRec) || bgOf(master) || bgOf(main)) || { color: scheme[0], alpha: 1 };
  const walk = (grp, isMaster, T = null, depth = 0) => {
    if (depth > 32) return; // groups nest a few levels; deeper is a damaged file (and would overflow the stack)
    let k = 0;
    for (const c of children(D, grp.p, grp.end)) {
      if (c.type === 0xf003) {
        // nested group: its first shape carries the child coordinate space (FSPGR) and the group's own anchor
        const head = first(D, c, 0xf004);
        const fspgr = head && first(D, head, 0xf009);
        const box = head && anchorBox(D, head, T);
        if (fspgr && box) {
          const cx0 = i32(D, fspgr.p); const cy0 = i32(D, fspgr.p + 4);
          const cw = i32(D, fspgr.p + 8) - cx0 || 1; const chh = i32(D, fspgr.p + 12) - cy0 || 1;
          walk(c, isMaster, { x: (v) => box.x + ((v - cx0) / cw) * box.w, y: (v) => box.y + ((v - cy0) / chh) * box.h }, depth + 1);
        } else walk(c, isMaster, T, depth + 1);
        continue;
      }
      if (c.type !== 0xf004) continue;
      if (k++ === 0 && first(D, c, 0xf009)) continue; // the group's own record
      let node = null;
      try { node = shapeNode(D, c, { ...ctx, T, styles }, scheme, isMaster); } catch { node = null; } // one bad shape must not lose the slide
      if (node) nodes.push(node);
    }
  };
  const shapesOf = (rec, isMaster) => {
    const ppd = first(D, rec, 0x040c);
    const dgc = ppd && first(D, ppd, 0xf002);
    const spgr = dgc && first(D, dgc, 0xf003);
    if (spgr) walk(spgr, isMaster);
  };
  if (master && (flags & 1)) { if (main !== master) shapesOf(main, true); shapesOf(master, true); } // fMasterObjects
  shapesOf(slideRec, false);
  return { width: ctx.width, height: ctx.height, bg, nodes };
}

/** shape rectangle in points: ClientAnchor (top, left, right, bottom on the slide) or ChildAnchor (left, top,
 * right, bottom in the enclosing group's coordinate space, mapped through T) */
function anchorBox(D, sp, T) {
  const ca = first(D, sp, 0xf010);
  if (ca) {
    const r = ca.end - ca.p >= 16
      ? { y: i32(D, ca.p), x: i32(D, ca.p + 4), r: i32(D, ca.p + 8), b: i32(D, ca.p + 12) }
      : { y: i16(D, ca.p), x: i16(D, ca.p + 2), r: i16(D, ca.p + 4), b: i16(D, ca.p + 6) };
    return { x: r.x * MU, y: r.y * MU, w: Math.max(0, r.r - r.x) * MU, h: Math.max(0, r.b - r.y) * MU };
  }
  const ch = first(D, sp, 0xf00f);
  if (ch && T) {
    const x0 = T.x(i32(D, ch.p));
    const y0 = T.y(i32(D, ch.p + 4));
    return { x: x0, y: y0, w: Math.max(0, T.x(i32(D, ch.p + 8)) - x0), h: Math.max(0, T.y(i32(D, ch.p + 12)) - y0) };
  }
  return null;
}

/** OfficeArt freeform: pVertices (0x0145) + pSegmentInfo (0x0146) in the geoLeft..geoBottom space */
function freeform(fopt, w, h) {
  const arr = (v) => {
    const d = v?.complex;
    if (!d || d.length < 6) return null;
    const n = u16(d, 0);
    let size = u16(d, 4);
    if (size === 0xfff0) size = 4; // packed 16-bit points
    return { n, size, d };
  };
  const V = arr(fopt[0x0145]);
  if (!V) return null;
  const pts = [];
  for (let i = 0; i < V.n; i++) {
    const o = 6 + i * V.size;
    if (o + V.size > V.d.length) break;
    pts.push(V.size === 4 ? [i16(V.d, o), i16(V.d, o + 2)] : [i32(V.d, o), i32(V.d, o + 4)]);
  }
  if (pts.length < 2) return null;
  const gl = typeof fopt[0x0140] === 'number' ? fopt[0x0140] | 0 : 0;
  const gt = typeof fopt[0x0141] === 'number' ? fopt[0x0141] | 0 : 0;
  const gr = typeof fopt[0x0142] === 'number' ? fopt[0x0142] | 0 : 21600;
  const gb = typeof fopt[0x0143] === 'number' ? fopt[0x0143] | 0 : 21600;
  const sx = w / ((gr - gl) || 1);
  const sy = h / ((gb - gt) || 1);
  const P = (i) => { const q = pts[Math.min(i, pts.length - 1)]; return [(q[0] - gl) * sx, (q[1] - gt) * sy]; };
  const d = [];
  let k = 0;
  const S = arr(fopt[0x0146]);
  const segs = [];
  if (S) for (let i = 0; i < S.n; i++) segs.push(u16(S.d, 6 + i * 2));
  else { segs.push(0x4000, 0xb000 | (pts.length - 1)); } // no segment info: a polyline through all points
  let closed = false;
  for (const seg of segs) {
    const type = seg >> 13;
    const count = seg & 0x1fff || 1;
    if (type === 0) for (let c = 0; c < count && k < pts.length; c++) d.push(['L', ...P(k++)]); // lineTo
    else if (type === 1) for (let c = 0; c < count && k + 2 < pts.length; c++) { d.push(['C', ...P(k), ...P(k + 1), ...P(k + 2)]); k += 3; } // curveTo
    else if (type === 2) d.push(['M', ...P(k++)]); // moveTo
    else if (type === 3) { d.push(['Z']); closed = true; } // close
    else if (type === 4) break; // end
    else if (type === 5 && (seg >> 8 & 0x1f) === 0) continue;
  }
  if (!d.length || d[0][0] !== 'M') d.unshift(['M', ...P(0)]);
  if (d.length < 2) return null;
  return { paths: [{ d, fill: closed, stroke: true }], text: { l: 0, t: 0, r: w, b: h } };
}

const PH_TITLE = new Set([13, 15, 17]);
const PH_BODY = new Set([14, 16, 18, 19, 20]);

function shapeNode(D, sp, ctx, scheme, isMaster) {
  const fsp = first(D, sp, 0xf00a);
  if (!fsp) return null;
  const spFlags = u32(D, fsp.p + 4);
  if (spFlags & 0x1) return null; // group shape record: its children are walked separately
  if (spFlags & 0x400) return null; // background
  const b0 = anchorBox(D, sp, ctx.T);
  if (!b0) return null;
  const fopt = props(D, first(D, sp, 0xf00b));
  const type = fsp.inst;
  // placeholder?
  const cd = first(D, sp, 0xf011);
  const ph = cd && first(D, cd, 0x0bc3);
  const phType = ph ? D[ph.p + 4] : null;
  if (isMaster && ph) return null; // master placeholders are templates, not content
  // picture
  const pib = fopt[0x0104];
  if (pib && typeof pib === 'number' && ctx.blips[pib - 1]) {
    const img = ctx.blips[pib - 1];
    return { kind: 'pic', box: b0, rot: 0, img: img.data ? { data: img.data, format: img.format, alpha: 1 } : null, geom: null, line: null };
  }
  // fill and line: OfficeArt defaults are a white fill with a black hairline, but text boxes, lines and
  // placeholders (which take their look from the master) start with neither
  const plain = type === 202 || ph != null;
  const fill = fillOf(fopt, scheme, ctx.blips, !plain && type !== 20 && type !== 32);
  const lb = fopt[0x01ff];
  const lined = typeof lb === 'number' && lb & 0x80000 ? !!(lb & 0x8) : !plain;
  const DASHES = [null, [3, 1], [1, 1], [3, 1, 1, 1], [3, 1, 1, 1, 1, 1], [1, 1], [4, 3], [8, 3], [4, 3, 1, 3], [8, 3, 1, 3], [8, 3, 1, 3, 1, 3]];
  const line = lined ? {
    color: typeof fopt[0x01c0] === 'number' ? colorRef(fopt[0x01c0], scheme) || '#000000' : '#000000', alpha: 1,
    w: typeof fopt[0x01cb] === 'number' ? fopt[0x01cb] / 12700 : 0.75, dash: typeof fopt[0x01ce] === 'number' ? DASHES[fopt[0x01ce]] || null : null,
  } : null;
  const prst = SHAPES[type] || 'rect';
  const rot = typeof fopt[0x0004] === 'number' ? (fopt[0x0004] | 0) / 65536 : 0;
  // OfficeArt stores the anchor of a shape turned by 45-135 (or 225-315) degrees with width and height swapped
  const r = ((rot % 360) + 360) % 360;
  if ((r >= 45 && r < 135) || (r >= 225 && r < 315)) {
    const cx = b0.x + b0.w / 2;
    const cy = b0.y + b0.h / 2;
    [b0.w, b0.h] = [b0.h, b0.w];
    b0.x = cx - b0.w / 2;
    b0.y = cy - b0.h / 2;
  }
  const geom = (typeof fopt[0x0145] === 'object' && freeform(fopt, b0.w, b0.h)) || presetGeometry(prst, b0.w, b0.h, {});
  // text
  const tb = first(D, sp, 0xf00d);
  let text = null;
  if (tb) text = textBody(D, tb, ctx, scheme, phType, fopt);
  if (!fill && !line && !text) return null;
  return { kind: 'sp', box: b0, rot, flipH: !!(spFlags & 0x40), flipV: !!(spFlags & 0x80), geom, fill, line, text, connector: type === 20 || type === 32 };
}

function textBody(D, tb, ctx, scheme, phType, fopt) {
  let str = null;
  let style = null;
  let textType = null;
  const ruler = {};
  for (const c of children(D, tb.p, tb.end)) {
    if (c.type === 0x0fa6) {
      // TextRulerAtom: this box's own margins/indents per level, overriding the master's
      const m = u32(D, c.p);
      let q = c.p + 4;
      if (m & 2) q += 2;
      if (m & 1) q += 2;
      if (m & 4) { const n = u16(D, q); q += 2 + n * 4; }
      for (let lv = 0; lv < 5; lv++) {
        if (m & (8 << lv)) { (ruler[lv] ||= {}).left = u16(D, q); q += 2; }
        if (m & (0x100 << lv)) { (ruler[lv] ||= {}).indentPos = u16(D, q); q += 2; }
      }
    }
    if (c.type === 0x0f9f) textType = u32(D, c.p);
    else if (c.type === 0x0fa0 || c.type === 0x0fa8) str = readText(D, c);
    else if (c.type === 0x0fa1) style = c;
    else if (c.type === 0x0f9e) {
      // placeholder text lives in the slide's outline list (SlideListWithText)
      const t = ctx.texts?.[u32(D, c.p)];
      if (t) { str = t.str; style = t.style; textType = t.kind; }
    }
  }
  if (!str || !str.replace(/[\r\s]/g, '')) return null;
  const { pf, cf } = styleRuns(D, style, str.length);
  // text type: from the text header, else from the placeholder; 0 title, 1 body, 4 other, 5 subtitle, 6 centred title
  const tt = textType ?? (PH_TITLE.has(phType) ? 0 : PH_BODY.has(phType) ? 1 : 4);
  const title = tt === 0 || tt === 6;
  const body = tt === 1 || tt === 5 || tt === 7 || tt === 8;
  const levels = ctx.styles?.[tt] || ctx.styles?.[title ? 0 : body ? 1 : 4] || [];
  const ms = (lvl) => levels[Math.min(lvl, levels.length - 1)] || { pf: {}, cf: {} };
  const defSize = (lvl) => ms(lvl).cf.size || (title ? 44 : body ? [32, 28, 24, 20, 20][Math.min(lvl, 4)] : 18);
  const paras = [];
  let pos = 0;
  let pfi = 0;
  let pfLeft = pf[0]?.count ?? Infinity;
  let cfi = 0;
  let cfLeft = cf[0]?.count ?? Infinity;
  for (const ptext of str.split('\r')) {
    const lvl0 = (pf[pfi] || {}).indent || 0;
    const pr = { ...ms(lvl0).pf, ...(ruler[lvl0] || {}), ...(pf[pfi] || {}) };
    const lvl = lvl0;
    const runs = [];
    let cur = null;
    for (const ch of ptext + '\r') {
      const r = { ...ms(lvl).cf, ...(cf[cfi] || {}) };
      if (ch !== '\r') {
        const st = {
          font: r.font != null ? ctx.fonts[r.font] || 'Arial' : ctx.fonts[0] || 'Arial', ea: null, cs: null, sym: null,
          size: r.size || defSize(lvl), bold: !!r.bold, italic: !!r.italic, u: r.underline ? 'sng' : null, strike: null, cap: 'none',
          baseline: r.position ? r.position / 100 : 0, spc: 0, color: r.color != null ? textColor(r.color, scheme) || (title ? scheme[3] : scheme[1]) : title ? scheme[3] : scheme[1],
          alpha: 1, highlight: null, link: null,
        };
        const c = ch === '\x0b' ? null : ch;
        if (c === null) { runs.push({ kind: 'br', style: st }); cur = null; } else if (cur && JSON.stringify(cur.style) === JSON.stringify(st)) cur.text += c;
        else { cur = { kind: 'text', text: c, style: st }; runs.push(cur); }
      }
      pos++;
      if (--cfLeft <= 0) { cfi++; cfLeft = cf[cfi]?.count ?? Infinity; }
    }
    const end = runs.find((r) => r.style)?.style || { font: ctx.fonts[0] || 'Arial', size: defSize(lvl), bold: false, italic: false, color: '#000000' };
    const bulletOn = pr.bulletOn ?? false;
    paras.push({
      lvl, algn: ['l', 'ctr', 'r', 'just'][pr.align ?? (title ? 1 : 0)] || 'l',
      marL: pr.left != null ? pr.left * MU : body ? lvl * 36 + (bulletOn ? 27 : 0) : 0,
      indent: pr.indentPos != null && pr.left != null ? (pr.indentPos - pr.left) * MU : bulletOn && body ? -27 : 0,
      marR: 0, rtl: false,
      lnSpc: pr.lineSpacing > 0 ? { pct: pr.lineSpacing / 100 } : pr.lineSpacing < 0 ? { pts: -pr.lineSpacing / 8 } : { pct: 1 },
      spcBef: pr.before > 0 ? { pct: pr.before / 100 } : pr.before < 0 ? { pts: -pr.before / 8 } : body ? { pct: 0.2 } : null,
      spcAft: pr.after > 0 ? { pct: pr.after / 100 } : pr.after < 0 ? { pts: -pr.after / 8 } : null,
      defTab: 72, tabs: [],
      bullet: bulletOn && runs.some((r) => r.kind === 'text' && r.text.trim()) ? { type: 'char', char: pr.bulletChar && pr.bulletChar !== '\0' ? pr.bulletChar : '•', font: 'Arial', color: end.color, size: { pct: 1 } } : null,
      runs, end,
    });
    if (--pfLeft <= 0 || pfLeft === Infinity) { if (pfLeft <= 0) { pfi++; pfLeft = pf[pfi]?.count ?? Infinity; } }
  }
  // text frame insets / anchor from the shape properties
  const ins = (id, def) => (fopt[id] != null ? fopt[id] / 12700 : def);
  const anchor = fopt[0x0087];
  return {
    bodyPr: {
      lIns: ins(0x0081, 7.2), tIns: ins(0x0082, 3.6), rIns: ins(0x0083, 7.2), bIns: ins(0x0084, 3.6),
      anchor: anchor == null ? (title ? 'ctr' : 't') : [0, 3, 6, 8].includes(anchor) ? 't' : [1, 4, 7, 9].includes(anchor) ? 'ctr' : 'b',
      wrap: fopt[0x0085] === 2 ? 'none' : 'square',
    },
    paras,
  };
}
