// PowerPoint (.pptx) reader: resolves the slide -> layout -> master -> theme inheritance into a flat,
// fully styled scene per slide (positions in points, colours resolved, text runs with final properties).
// Measuring and line breaking happen later in layout.js, which needs the fonts.
import { openPackage } from '../common/ooxml.js';
import { kid, kids, attr, descendants, num, parseXml } from '../common/xml.js';
import { parseThemePart, dmlColor, colorChild } from '../common/color.js';
import { parseChart } from '../common/chart.js';
import { presetGeometry, adjustValues, customGeometry } from './geom.js';
import { builtinTableStyle } from './tablestyles.js';

const EMU = 12700;
const pt = (v) => (Number(v) || 0) / EMU;
const on = (v) => v === '1' || v === 'true' || v === 'on';

// ------------------------------------------------------------------ fills --
/** first fill child of el -> raw spec (colours stay as XML until the slide's colour map is known) */
function fillSpec(el) {
  for (const c of kids(el)) {
    switch (c.localName) {
      case 'noFill': return { kind: 'none' };
      case 'solidFill': return { kind: 'solid', el: colorChild(c) };
      case 'gradFill': return { kind: 'grad', el: c };
      case 'blipFill': return { kind: 'blip', el: c };
      case 'pattFill': return { kind: 'patt', el: c };
      case 'grpFill': return { kind: 'grp' };
      default: break;
    }
  }
  return null;
}

function mix(a, b, t) {
  const p = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map((i) => Math.round(p(a, i) * (1 - t) + p(b, i) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** spec -> { color, alpha } | { grad } | { img } | null */
export function resolveFill(spec, env, ctx) {
  if (!spec || spec.kind === 'none') return null;
  if (spec.kind === 'resolved') return spec.c;
  if (spec.kind === 'solid') return spec.el ? dmlColor(spec.el, env) : null;
  if (spec.kind === 'grp') return ctx?.groupFill || null;
  if (spec.kind === 'patt') {
    const fg = dmlColor(colorChild(kid(spec.el, 'fgClr')), env) || { color: '#000000', alpha: 1 };
    const bg = dmlColor(colorChild(kid(spec.el, 'bgClr')), env) || { color: '#FFFFFF', alpha: 1 };
    const dense = /(pct(5|10|20|25))|ltHorz|ltVert|ltUpDiag|ltDnDiag|smGrid|dotGrid/.test(attr(spec.el, 'prst') || '') ? 0.25 : 0.5;
    return { color: mix(bg.color, fg.color, dense), alpha: bg.alpha };
  }
  if (spec.kind === 'grad') {
    const stops = kids(kid(spec.el, 'gsLst'), 'gs')
      .map((gs) => ({ pos: num(attr(gs, 'pos')) / 100000, c: dmlColor(colorChild(gs), env) }))
      .filter((s) => s.c)
      .sort((a, b) => a.pos - b.pos);
    if (!stops.length) return null;
    if (stops.length === 1) return stops[0].c;
    const path = kid(spec.el, 'path');
    let grad;
    if (path) {
      const r = kid(path, 'fillToRect');
      const l = num(attr(r, 'l')) / 100000;
      const t = num(attr(r, 't')) / 100000;
      const rr = num(attr(r, 'r')) / 100000;
      const b = num(attr(r, 'b')) / 100000;
      // DrawingML path gradients run from the focus (pos 0) outwards; PDF radial shadings do the same
      grad = { type: 'radial', cx: (l + 1 - rr) / 2, cy: (t + 1 - b) / 2, stops: stops.map((s) => [s.pos, s.c.color, s.c.alpha]) };
    } else {
      const lin = kid(spec.el, 'lin');
      grad = { type: 'linear', angle: lin ? num(attr(lin, 'ang')) / 60000 : 90, stops: stops.map((s) => [s.pos, s.c.color, s.c.alpha]) };
    }
    // average colour, for places that can only take one (text, chart bars)
    const avg = stops.reduce((acc, s) => mix(acc, s.c.color, 0.5), stops[0].c.color);
    return { grad, color: avg, alpha: 1 };
  }
  if (spec.kind === 'blip') return ctx?.image ? { img: ctx.image(spec.el), color: null, alpha: 1 } : null;
  return null;
}

// ------------------------------------------------------------------ lines --
const DASH = {
  solid: null, dot: [1, 1], dash: [4, 3], lgDash: [8, 3], dashDot: [4, 3, 1, 3], lgDashDot: [8, 3, 1, 3], lgDashDotDot: [8, 3, 1, 3, 1, 3],
  sysDash: [3, 1], sysDot: [1, 1], sysDashDot: [3, 1, 1, 1], sysDashDotDot: [3, 1, 1, 1, 1, 1],
};
/** merge a:ln elements (least specific first) into a raw line spec */
function lineSpec(list) {
  const out = {};
  for (const { el, ph } of list) {
    if (!el) continue;
    if (attr(el, 'w') != null) out.w = pt(attr(el, 'w'));
    const f = fillSpec(el);
    if (f) { out.fill = f; out.ph = ph; }
    const pd = kid(el, 'prstDash');
    if (pd) out.dash = DASH[attr(pd, 'val')] ?? null;
    const cd = kid(el, 'custDash');
    if (cd) out.dash = kids(cd, 'ds').flatMap((d) => [num(attr(d, 'd')) / 100000, num(attr(d, 'sp')) / 100000]);
    if (attr(el, 'cap')) out.cap = { rnd: 'round', sq: 'square', flat: 'butt' }[attr(el, 'cap')];
    if (kid(el, 'round')) out.join = 'round';
    else if (kid(el, 'bevel')) out.join = 'bevel';
    else if (kid(el, 'miter')) out.join = 'miter';
    for (const k of ['headEnd', 'tailEnd']) {
      const e = kid(el, k);
      if (e) out[k] = { type: attr(e, 'type') || 'none', w: attr(e, 'w') || 'med', len: attr(e, 'len') || 'med' };
    }
  }
  return out;
}
function resolveLine(spec, env) {
  if (!spec?.fill || spec.fill.kind === 'none') return null;
  const c = resolveFill(spec.fill, spec.ph ? { ...env, ph: spec.ph } : env);
  if (!c?.color) return null;
  return {
    color: c.color, alpha: c.alpha, w: spec.w ?? 0.75, dash: spec.dash || null, cap: spec.cap, join: spec.join,
    head: spec.headEnd?.type !== 'none' ? spec.headEnd : null, tail: spec.tailEnd?.type !== 'none' ? spec.tailEnd : null,
  };
}

// ------------------------------------------------------------- text styles --
function parseRPr(el) {
  if (!el) return null;
  const r = {};
  const sz = attr(el, 'sz');
  if (sz != null) r.size = Number(sz) / 100;
  if (attr(el, 'b') != null) r.bold = on(attr(el, 'b'));
  if (attr(el, 'i') != null) r.italic = on(attr(el, 'i'));
  if (attr(el, 'u') != null) r.u = attr(el, 'u') === 'none' ? null : attr(el, 'u');
  if (attr(el, 'strike') != null) r.strike = attr(el, 'strike') === 'noStrike' ? null : attr(el, 'strike');
  if (attr(el, 'cap') != null) r.cap = attr(el, 'cap');
  if (attr(el, 'baseline') != null) r.baseline = Number(attr(el, 'baseline')) / 100000;
  if (attr(el, 'spc') != null) r.spc = Number(attr(el, 'spc')) / 100;
  const f = fillSpec(el);
  if (f) r.fill = f;
  for (const k of ['latin', 'ea', 'cs', 'sym']) {
    const e = kid(el, k);
    if (e && attr(e, 'typeface') != null) r[k] = attr(e, 'typeface');
  }
  const hl = kid(el, 'highlight');
  if (hl) r.highlight = colorChild(hl);
  const link = kid(el, 'hlinkClick');
  if (link && attr(link, 'r:id')) r.link = attr(link, 'r:id');
  return r;
}

function parsePPr(el) {
  if (!el) return null;
  const p = {};
  for (const k of ['marL', 'marR', 'indent', 'defTabSz']) if (attr(el, k) != null) p[k] = pt(attr(el, k));
  if (attr(el, 'algn')) p.algn = attr(el, 'algn');
  if (attr(el, 'rtl') != null) p.rtl = on(attr(el, 'rtl'));
  for (const k of ['lnSpc', 'spcBef', 'spcAft']) {
    const s = kid(el, k);
    if (!s) continue;
    const pc = kid(s, 'spcPct');
    const pp = kid(s, 'spcPts');
    if (pc) p[k] = { pct: num(attr(pc, 'val')) / 100000 };
    else if (pp) p[k] = { pts: num(attr(pp, 'val')) / 100 };
  }
  if (kid(el, 'buClrTx')) p.buClr = 'tx';
  else if (kid(el, 'buClr')) p.buClr = colorChild(kid(el, 'buClr'));
  if (kid(el, 'buSzTx')) p.buSz = 'tx';
  else if (kid(el, 'buSzPct')) p.buSz = { pct: num(attr(kid(el, 'buSzPct'), 'val')) / 100000 };
  else if (kid(el, 'buSzPts')) p.buSz = { pts: num(attr(kid(el, 'buSzPts'), 'val')) / 100 };
  if (kid(el, 'buFontTx')) p.buFont = 'tx';
  else if (kid(el, 'buFont')) p.buFont = attr(kid(el, 'buFont'), 'typeface');
  if (kid(el, 'buNone')) p.bu = { type: 'none' };
  else if (kid(el, 'buChar')) p.bu = { type: 'char', char: attr(kid(el, 'buChar'), 'char') || '•' };
  else if (kid(el, 'buAutoNum')) {
    const n = kid(el, 'buAutoNum');
    p.bu = { type: 'num', scheme: attr(n, 'type') || 'arabicPeriod', startAt: num(attr(n, 'startAt'), 1) };
  } else if (kid(el, 'buBlip')) p.bu = { type: 'char', char: '•' };
  const tabs = kid(el, 'tabLst');
  if (tabs) p.tabs = kids(tabs, 'tab').map((t) => ({ pos: pt(attr(t, 'pos')), algn: attr(t, 'algn') || 'l' }));
  const d = kid(el, 'defRPr');
  if (d) p.rPr = parseRPr(d);
  return p;
}
const mergeR = (a, b) => (!b ? a : !a ? b : { ...a, ...b });
function mergeP(a, b) {
  if (!b) return a;
  if (!a) return b;
  return { ...a, ...b, rPr: mergeR(a.rPr, b.rPr) };
}
/** a:lstStyle / p:titleStyle / ... -> 9 levels of merged paragraph properties */
function parseListStyle(el) {
  const out = new Array(9).fill(null);
  if (!el) return out;
  const def = parsePPr(kid(el, 'defPPr'));
  for (let i = 0; i < 9; i++) out[i] = mergeP(def, parsePPr(kid(el, `lvl${i + 1}pPr`)));
  return out;
}
const stackLists = (lists) => {
  const out = new Array(9).fill(null);
  for (const l of lists) if (l) for (let i = 0; i < 9; i++) out[i] = mergeP(out[i], l[i]);
  return out;
};

function parseBodyPr(el) {
  const b = {};
  if (!el) return b;
  for (const k of ['lIns', 'tIns', 'rIns', 'bIns']) if (attr(el, k) != null) b[k] = pt(attr(el, k));
  for (const k of ['anchor', 'wrap', 'vert', 'anchorCtr', 'numCol', 'spcCol', 'rot', 'upright']) if (attr(el, k) != null) b[k] = attr(el, k);
  const n = kid(el, 'normAutofit');
  if (n) b.autofit = { type: 'norm', fontScale: num(attr(n, 'fontScale'), 100000) / 100000, lnSpcReduction: num(attr(n, 'lnSpcReduction'), 0) / 100000, stored: attr(n, 'fontScale') != null };
  else if (kid(el, 'spAutoFit')) b.autofit = { type: 'shape' };
  else if (kid(el, 'noAutofit')) b.autofit = { type: 'none' };
  return b;
}

// ------------------------------------------------------------- the package --
const IMG_TYPES = { png: 'png', jpg: 'jpg', jpeg: 'jpg', jpe: 'jpg', gif: 'gif', bmp: 'bmp', tif: 'tiff', tiff: 'tiff', emf: 'emf', wmf: 'wmf', svg: 'svg', wdp: 'wdp', jfif: 'jpg' };
function sniffImage(bytes, name) {
  if (bytes?.length > 4) {
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'png';
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg';
    if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'gif';
  }
  return IMG_TYPES[String(name).split('.').pop().toLowerCase()] || 'unknown';
}

export function loadPptx(bytes, { maxSlides, limits } = {}) {
  const pkg = openPackage(bytes, limits);
  maxSlides ??= pkg.limits.maxSlides;
  const presPath = pkg.main && pkg.main.endsWith('presentation.xml') ? pkg.main : 'ppt/presentation.xml';
  const presDoc = pkg.xml(presPath);
  if (!presDoc) throw new Error('Not a PowerPoint file (ppt/presentation.xml is missing)');
  const pres = presDoc.documentElement;
  const presRels = pkg.rels(presPath);
  const sz = kid(pres, 'sldSz');
  const width = pt(attr(sz, 'cx') || 9144000);
  const height = pt(attr(sz, 'cy') || 6858000);
  // PowerPoint's built-in text defaults sit under the file's own: 18pt, each level indented another half inch
  const builtin = Array.from({ length: 9 }, (_, i) => ({ marL: i * 36, indent: 0, algn: 'l', defTabSz: 72, rPr: { size: 18 } }));
  const defaultStyle = stackLists([builtin, parseListStyle(kid(pres, 'defaultTextStyle'))]);
  const firstNum = num(attr(pres, 'firstSlideNum'), 1);

  const parts = new Map(); // path -> { doc, rels, path }
  const part = (p) => {
    if (!p) return null;
    if (!parts.has(p)) { const doc = pkg.xml(p); parts.set(p, doc ? { doc, root: doc.documentElement, rels: pkg.rels(p), path: p } : null); }
    return parts.get(p);
  };
  const relOf = (pt_, type) => { for (const r of pt_.rels.values()) if (r.type.endsWith('/' + type) && !r.external) return r.target; return null; };

  // masters: theme, colour map, text styles, placeholders
  const masters = new Map();
  const master = (p) => {
    if (masters.has(p)) return masters.get(p);
    const m = part(p);
    if (!m) return null;
    const th = part(relOf(m, 'theme'));
    const fs = th && descendants(th.root, 'fmtScheme')[0];
    const cm = kid(m.root, 'clrMap');
    const map = {};
    if (cm) for (const k of ['bg1', 'tx1', 'bg2', 'tx2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink']) if (attr(cm, k)) map[k] = attr(cm, k);
    const tx = kid(m.root, 'txStyles');
    const info = {
      part: m,
      theme: parseThemePart(th?.doc),
      fmt: { fill: kids(kid(fs, 'fillStyleLst')), ln: kids(kid(fs, 'lnStyleLst')), bg: kids(kid(fs, 'bgFillStyleLst')) },
      map,
      styles: { title: parseListStyle(kid(tx, 'titleStyle')), body: parseListStyle(kid(tx, 'bodyStyle')), other: parseListStyle(kid(tx, 'otherStyle')) },
    };
    masters.set(p, info);
    return info;
  };

  const slides = [];
  for (const id of kids(kid(pres, 'sldIdLst'), 'sldId')) {
    if (slides.length >= maxSlides) break;
    const rel = presRels.get(attr(id, 'r:id'));
    if (!rel) continue;
    const s = part(rel.target);
    if (!s) continue;
    const lay = part(relOf(s, 'slideLayout'));
    const mas = lay ? master(relOf(lay, 'slideMaster')) : null;
    if (!mas) continue;
    slides.push({ part: s, layout: lay, master: mas, hidden: attr(s.root, 'show') === '0' });
  }
  const tableStylesPart = part(relOf({ rels: presRels }, 'tableStyles'));
  return { pkg, part, width, height, defaultStyle, firstNum, slides, tableStyles: tableStylesPart?.root || null };
}

// ------------------------------------------------------------- placeholders --
const PH_DEFAULT = 'obj';
function phOf(el) {
  const nv = kids(el).find((c) => /^nv.*Pr$/.test(c.localName));
  const ph = nv && descendants(nv, 'ph')[0];
  if (!ph) return null;
  return { type: attr(ph, 'type') || PH_DEFAULT, idx: attr(ph, 'idx') };
}
const styleKind = (type) => (type === 'title' || type === 'ctrTitle' ? 'title' : ['dt', 'ftr', 'sldNum', 'hdr'].includes(type) ? 'other' : 'body');
const masterType = (type) => (type === 'ctrTitle' ? 'title' : ['dt', 'ftr', 'sldNum', 'hdr', 'title'].includes(type) ? type : 'body');

function placeholders(root) {
  const list = [];
  const walk = (tree) => {
    for (const el of kids(tree)) {
      if (el.localName === 'grpSp') walk(el);
      else { const ph = phOf(el); if (ph) list.push({ el, ...ph }); }
    }
  };
  walk(descendants(root, 'spTree')[0]);
  return list;
}
function findPh(list, ph, { byType = false } = {}) {
  if (!list) return null;
  if (!byType && ph.idx != null) {
    const m = list.find((p) => p.idx === ph.idx);
    if (m) return m;
  }
  const t = byType ? masterType(ph.type) : ph.type;
  return list.find((p) => (byType ? masterType(p.type) : p.type) === t) || (ph.type === 'obj' || ph.type === 'body' ? list.find((p) => p.type === 'body' || p.type === 'obj') : null);
}

// ------------------------------------------------------------- slide scene --
/**
 * Build the display scene for one slide.
 * Returns { width, height, bg, nodes } where nodes are sp/pic/tbl/chart/grp in z-order.
 */
export function buildSlide(model, slide, slideNo) {
  const { master: M, layout: L, part: S } = slide;
  // colour map: slide override > layout override > master
  let map = M.map;
  for (const p of [L, S]) {
    const ov = descendants(kid(p.root, 'clrMapOvr'), 'overrideClrMapping')[0];
    if (ov) { map = {}; for (const a of Array.from(ov.attributes)) map[a.localName] = a.value; }
  }
  const env = { theme: M.theme, map, ph: null };
  const masterPh = placeholders(M.part.root);
  const layoutPh = placeholders(L.root);
  const media = new Map();
  const ctxFor = (p) => ({
    model, part: p, env, slideNo, M, masterPh, layoutPh,
    isSlide: p === S,
    image: (blipFill) => {
      const blip = kid(blipFill, 'blip');
      const rel = blip && p.rels.get(attr(blip, 'r:embed'));
      if (!rel || rel.external) return null;
      if (!media.has(rel.target)) {
        const data = model.pkg.bin(rel.target);
        media.set(rel.target, data ? { data, format: sniffImage(data, rel.target) } : null);
      }
      const img = media.get(rel.target);
      if (!img) return null;
      const src = kid(blipFill, 'srcRect');
      const crop = src ? { l: num(attr(src, 'l')) / 100000, t: num(attr(src, 't')) / 100000, r: num(attr(src, 'r')) / 100000, b: num(attr(src, 'b')) / 100000 } : null;
      const amt = kid(blip, 'alphaModFix');
      const tile = kid(blipFill, 'tile');
      return {
        ...img, crop, alpha: amt ? num(attr(amt, 'amt'), 100000) / 100000 : 1,
        tile: tile ? { sx: num(attr(tile, 'sx'), 100000) / 100000, sy: num(attr(tile, 'sy'), 100000) / 100000, tx: pt(attr(tile, 'tx')), ty: pt(attr(tile, 'ty')) } : null,
      };
    },
  });

  // background: first of slide / layout / master that defines one
  let bg = null;
  for (const p of [S, L, M.part]) {
    const b = kid(kid(p.root, 'cSld'), 'bg');
    if (!b) continue;
    const ctx = ctxFor(p);
    const bgPr = kid(b, 'bgPr');
    const ref = kid(b, 'bgRef');
    if (bgPr) bg = resolveFill(fillSpec(bgPr), env, ctx);
    else if (ref) bg = styleFill(num(attr(ref, 'idx')), colorChild(ref), ctx);
    break;
  }

  const nodes = [];
  const showSlideMaster = attr(S.root, 'showMasterSp') !== '0';
  if (showSlideMaster && attr(L.root, 'showMasterSp') !== '0') nodes.push(...shapesOf(M.part, ctxFor(M.part), { skipPh: true }));
  if (showSlideMaster) nodes.push(...shapesOf(L, ctxFor(L), { skipPh: true }));
  nodes.push(...shapesOf(S, ctxFor(S), { skipPh: false }));
  return { width: model.width, height: model.height, bg, nodes, env };
}

function styleFill(idx, colorEl, ctx) {
  const { fmt } = ctx.M;
  const ph = colorEl ? dmlColor(colorEl, ctx.env) : null;
  let el = null;
  if (idx >= 1001) el = fmt.bg[idx - 1001];
  else if (idx > 0) el = fmt.fill[idx - 1];
  if (!el) return null;
  return resolveFill(fillSpecOfEl(el), { ...ctx.env, ph }, ctx);
}
function fillSpecOfEl(el) {
  // a fill element itself (a:solidFill, a:gradFill ...) rather than a parent of one
  switch (el.localName) {
    case 'noFill': return { kind: 'none' };
    case 'solidFill': return { kind: 'solid', el: colorChild(el) };
    case 'gradFill': return { kind: 'grad', el };
    case 'blipFill': return { kind: 'blip', el };
    case 'pattFill': return { kind: 'patt', el };
    default: return null;
  }
}

function shapesOf(p, ctx, { skipPh }) {
  const tree = descendants(kid(p.root, 'cSld'), 'spTree')[0];
  const T = { ox: 0, oy: 0, sx: 1 / EMU, sy: 1 / EMU, cx: 0, cy: 0 };
  return treeNodes(tree, ctx, T, skipPh);
}

/** group transform: child EMU -> page pt */
const tx = (T, x) => T.ox + (x - T.cx) * T.sx;
const ty = (T, y) => T.oy + (y - T.cy) * T.sy;

function xfrmOf(el) {
  if (!el) return null;
  const off = kid(el, 'off');
  const ext = kid(el, 'ext');
  if (!off || !ext) return null;
  return {
    x: num(attr(off, 'x')), y: num(attr(off, 'y')), cx: num(attr(ext, 'cx')), cy: num(attr(ext, 'cy')),
    rot: num(attr(el, 'rot')) / 60000, flipH: on(attr(el, 'flipH')), flipV: on(attr(el, 'flipV')),
    chOff: kid(el, 'chOff'), chExt: kid(el, 'chExt'),
  };
}
const boxOf = (xf, T) => ({ x: tx(T, xf.x), y: ty(T, xf.y), w: xf.cx * T.sx, h: xf.cy * T.sy });

function treeNodes(tree, ctx, T, skipPh) {
  const out = [];
  for (let el of kids(tree)) {
    if (el.localName === 'AlternateContent') {
      el = kids(kid(el, 'Fallback') || kid(el, 'Choice'))[0];
      if (!el) continue;
    }
    const cNvPr = descendants(kids(el).find((c) => /^nv/.test(c.localName)) || el, 'cNvPr')[0];
    if (cNvPr && on(attr(cNvPr, 'hidden'))) continue;
    if (skipPh && phOf(el)) continue;
    let node = null;
    try {
      switch (el.localName) {
        case 'sp': case 'cxnSp': node = buildShape(el, ctx, T); break;
        case 'pic': node = buildPicture(el, ctx, T); break;
        case 'graphicFrame': node = buildFrame(el, ctx, T); break;
        case 'grpSp': node = buildGroup(el, ctx, T, skipPh); break;
        case 'contentPart': break;
        default: break;
      }
    } catch (e) {
      node = null; // one malformed shape must not lose the whole slide
    }
    if (node) out.push(node);
  }
  return out;
}

function buildGroup(el, ctx, T, skipPh) {
  const xf = xfrmOf(kid(kid(el, 'grpSpPr'), 'xfrm'));
  let T2 = T;
  let box = null;
  if (xf) {
    box = boxOf(xf, T);
    const chOff = xf.chOff;
    const chExt = xf.chExt;
    const cw = num(attr(chExt, 'cx')) || xf.cx;
    const ch = num(attr(chExt, 'cy')) || xf.cy;
    T2 = { ox: box.x, oy: box.y, cx: num(attr(chOff, 'x'), xf.x), cy: num(attr(chOff, 'y'), xf.y), sx: cw ? box.w / cw : T.sx, sy: ch ? box.h / ch : T.sy };
  }
  const gctx = { ...ctx, groupFill: resolveFill(fillSpec(kid(el, 'grpSpPr')), ctx.env, ctx) };
  const children = treeNodes(el, gctx, T2, skipPh);
  if (!children.length) return null;
  return { kind: 'grp', box, rot: xf?.rot || 0, flipH: xf?.flipH, flipV: xf?.flipV, children };
}

/** inheritance chain for a placeholder on a slide or layout: [master ph el, layout ph el] (least specific first) */
function phChain(el, ctx) {
  const ph = phOf(el);
  if (!ph) return { ph: null, chain: [] };
  const chain = [];
  const onLayout = ctx.part !== ctx.M.part && !ctx.isSlide;
  if (ctx.isSlide) {
    const l = findPh(ctx.layoutPh, ph);
    const m = findPh(ctx.masterPh, l ? { type: l.type, idx: l.idx } : ph, { byType: true });
    if (m) chain.push(m.el);
    if (l) chain.push(l.el);
  } else if (onLayout) {
    const m = findPh(ctx.masterPh, ph, { byType: true });
    if (m) chain.push(m.el);
  }
  return { ph, chain };
}

function buildShape(el, ctx, T) {
  const { ph, chain } = phChain(el, ctx);
  const spPr = kid(el, 'spPr');
  const all = [...chain, el];
  const spPrs = all.map((e) => kid(e, 'spPr'));
  let xf = null;
  for (const s of spPrs) xf = xfrmOf(kid(s, 'xfrm')) || xf;
  if (!xf) return null;
  const box = boxOf(xf, T);
  // geometry: nearest definition wins
  let geomEl = null;
  for (const s of spPrs) geomEl = kid(s, 'custGeom') || kid(s, 'prstGeom') || geomEl;
  const geom = geomEl?.localName === 'custGeom'
    ? customGeometry(geomEl, box.w, box.h)
    : presetGeometry(geomEl ? attr(geomEl, 'prst') : 'rect', box.w, box.h, geomEl ? adjustValues(geomEl) : {});
  // style references (p:style), nearest wins
  let style = null;
  for (const e of all) style = kid(e, 'style') || style;
  const env = ctx.env;
  // fill
  let fill = null;
  let fillSet = false;
  for (const s of spPrs) { const f = fillSpec(s); if (f) { fill = f; fillSet = true; } }
  let fillOut = fillSet ? resolveFill(fill, env, ctx) : null;
  if (!fillSet && style) {
    const fr = kid(style, 'fillRef');
    if (fr) fillOut = styleFill(num(attr(fr, 'idx')), colorChild(fr), ctx);
  }
  // line: theme line style first, then explicit a:ln from the inheritance chain
  const lnList = [];
  const lr = style && kid(style, 'lnRef');
  if (lr && num(attr(lr, 'idx')) > 0) {
    const tl = ctx.M.fmt.ln[num(attr(lr, 'idx')) - 1];
    if (tl) lnList.push({ el: tl, ph: dmlColor(colorChild(lr), env) });
  }
  for (const s of spPrs) lnList.push({ el: kid(s, 'ln'), ph: null });
  const line = resolveLine(lineSpec(lnList), env);
  // font reference colour/typeface from the shape style
  let fontRef = null;
  const fr = style && kid(style, 'fontRef');
  if (fr) {
    const c = colorChild(fr);
    fontRef = { font: { major: ctx.M.theme.major, minor: ctx.M.theme.minor }[attr(fr, 'idx')] || null, color: c ? dmlColor(c, env) : null };
  }
  const text = buildTextBody(el, chain, ph, ctx, fontRef);
  // empty placeholders are invisible in slide show / PDF unless the slide gives them their own look
  if (ph && ctx.isSlide && !text && !fillSet && !kid(spPr, 'ln')) return null;
  return { kind: 'sp', box, rot: xf.rot, flipH: xf.flipH, flipV: xf.flipV, geom, fill: fillOut, line, text, connector: el.localName === 'cxnSp' };
}

function buildPicture(el, ctx, T) {
  const { chain } = phChain(el, ctx);
  const spPrs = [...chain, el].map((e) => kid(e, 'spPr'));
  let xf = null;
  for (const s of spPrs) xf = xfrmOf(kid(s, 'xfrm')) || xf;
  if (!xf) return null;
  const box = boxOf(xf, T);
  const img = ctx.image(kid(el, 'blipFill'));
  let geomEl = null;
  for (const s of spPrs) geomEl = kid(s, 'custGeom') || kid(s, 'prstGeom') || geomEl;
  const prst = geomEl?.localName === 'prstGeom' ? attr(geomEl, 'prst') : null;
  const geom = geomEl?.localName === 'custGeom' ? customGeometry(geomEl, box.w, box.h)
    : prst && prst !== 'rect' ? presetGeometry(prst, box.w, box.h, adjustValues(geomEl)) : null;
  const lnList = [];
  const style = kid(el, 'style');
  const lr = style && kid(style, 'lnRef');
  if (lr && num(attr(lr, 'idx')) > 0) { const tl = ctx.M.fmt.ln[num(attr(lr, 'idx')) - 1]; if (tl) lnList.push({ el: tl, ph: dmlColor(colorChild(lr), ctx.env) }); }
  for (const s of spPrs) lnList.push({ el: kid(s, 'ln'), ph: null });
  return { kind: 'pic', box, rot: xf.rot, flipH: xf.flipH, flipV: xf.flipV, img, geom, line: resolveLine(lineSpec(lnList), ctx.env) };
}

function buildFrame(el, ctx, T) {
  const xf = xfrmOf(kid(el, 'xfrm'));
  if (!xf) return null;
  const box = boxOf(xf, T);
  const gd = descendants(el, 'graphicData')[0];
  const uri = attr(gd, 'uri') || '';
  if (uri.endsWith('/table')) return buildTable(descendants(gd, 'tbl')[0], box, ctx);
  if (uri.endsWith('/chart')) {
    const c = descendants(gd, 'chart')[0];
    const rel = c && ctx.part.rels.get(attr(c, 'r:id'));
    const cp = rel && ctx.model.part(rel.target);
    if (!cp) return null;
    return { kind: 'chart', box, chart: parseChart(cp.doc, ctx.env.theme, ctx.env.map, ctx.model.pkg?.limits), font: ctx.env.theme.minor || 'Calibri' };
  }
  if (uri.endsWith('/diagram')) {
    // SmartArt: PowerPoint stores a pre-rendered drawing of the diagram; draw that
    const ids = descendants(gd, 'relIds')[0];
    const dm = ids && ctx.part.rels.get(attr(ids, 'r:dm'));
    const dmPart = dm && ctx.model.part(dm.target);
    const ext = dmPart && descendants(dmPart.root, 'dataModelExt')[0];
    let drawing = ext && ctx.part.rels.get(attr(ext, 'relId'));
    if (!drawing) for (const r of ctx.part.rels.values()) if (r.type.endsWith('/diagramDrawing')) drawing = r;
    const dp = drawing && ctx.model.part(drawing.target);
    const tree = dp && descendants(dp.root, 'spTree')[0];
    if (!tree) return null;
    const children = treeNodes(tree, { ...ctx, part: dp, isSlide: false }, { ox: box.x, oy: box.y, cx: 0, cy: 0, sx: 1 / EMU, sy: 1 / EMU }, false);
    return children.length ? { kind: 'grp', box, rot: 0, children } : null;
  }
  // OLE objects and other frames: draw their preview picture if they carry one
  const pic = descendants(el, 'pic')[0];
  if (pic) {
    const img = ctx.image(kid(pic, 'blipFill'));
    if (img) return { kind: 'pic', box, rot: xf.rot, img, geom: null, line: null };
  }
  return null;
}

// ------------------------------------------------------------- text bodies --
function phStyles(chain, ctx) {
  return chain.map((e) => parseListStyle(kid(kid(e, 'txBody'), 'lstStyle')));
}

function buildTextBody(el, chain, ph, ctx, fontRef, extraLists = []) {
  const txBody = kid(el, 'txBody') || kid(el, 'txbody');
  if (!txBody) return null;
  const paraEls = kids(txBody, 'p');
  const hasText = paraEls.some((p) => kids(p).some((r) => (r.localName === 'r' || r.localName === 'fld') && (kid(r, 't')?.textContent || '').length));
  if (!hasText) return null;
  // body properties: master -> layout -> own, attribute by attribute
  const bodyPr = {};
  for (const e of [...chain, el]) {
    const b = parseBodyPr(kid(kid(e, 'txBody'), 'bodyPr'));
    Object.assign(bodyPr, b);
  }
  // list styles: presentation default -> master text style -> table style -> placeholder chain ->
  // shape style font reference (p:style/a:fontRef) -> the shape's own list style -> paragraph -> run
  const kind = ph ? styleKind(ph.type) : 'other';
  const refLayer = [];
  if (fontRef && (fontRef.color || fontRef.font)) {
    const rPr = {};
    if (fontRef.color) rPr.fill = { kind: 'resolved', c: fontRef.color };
    if (fontRef.font) rPr.latin = fontRef.font;
    refLayer.push(new Array(9).fill({ rPr }));
  }
  const lists = stackLists([ctx.model.defaultStyle, ctx.M.styles[kind], ...extraLists, ...phStyles(chain, ctx), ...refLayer, parseListStyle(kid(txBody, 'lstStyle'))]);
  return { bodyPr, paras: paragraphs(paraEls, lists, ctx) };
}

function paragraphs(paraEls, lists, ctx) {
  const { env } = ctx;
  const theme = env.theme;
  const face = (name) => {
    if (!name) return null;
    if (name.startsWith('+mj')) return theme.major;
    if (name.startsWith('+mn')) return theme.minor;
    return name;
  };
  return paraEls.map((p) => {
    const own = parsePPr(kid(p, 'pPr')) || {};
    const lvl = Math.max(0, Math.min(8, num(attr(kid(p, 'pPr'), 'lvl'), 0)));
    const P = mergeP(lists[lvl] || {}, own);
    const base = P.rPr || {};
    const resolve = (r) => {
      const m = { ...base, ...(r || {}) };
      const link = m.link ? ctx.part.rels.get(m.link) : null;
      // hyperlinks use the theme hyperlink colour and an underline unless the run sets its own colour
      let color = r?.link && !r.fill ? { color: theme[env.map?.hlink || 'hlink'] || theme.hlink, alpha: 1 } : resolveFill(m.fill, env, ctx);
      if (!color && m.fill?.kind === 'none') color = { color: '#000000', alpha: 0 };
      return {
        font: face(m.latin) || theme.minor || 'Calibri',
        ea: face(m.ea), cs: face(m.cs), sym: m.sym || null,
        size: m.size || 18, bold: !!m.bold, italic: !!m.italic,
        u: r?.link && r.u === undefined ? 'sng' : m.u || null, strike: m.strike || null,
        cap: m.cap || 'none', baseline: m.baseline || 0, spc: m.spc || 0,
        color: color?.color || '#000000', alpha: color?.alpha ?? 1,
        highlight: m.highlight ? dmlColor(m.highlight, env)?.color : null,
        link: link?.external ? link.target : null,
      };
    };
    const runs = [];
    for (const r of kids(p)) {
      if (r.localName === 'r') runs.push({ kind: 'text', text: kid(r, 't')?.textContent || '', style: resolve(parseRPr(kid(r, 'rPr'))) });
      else if (r.localName === 'br') runs.push({ kind: 'br', style: resolve(parseRPr(kid(r, 'rPr'))) });
      else if (r.localName === 'fld') {
        let t = kid(r, 't')?.textContent || '';
        if ((attr(r, 'type') || '').toLowerCase() === 'slidenum') t = String(ctx.slideNo);
        runs.push({ kind: 'text', text: t, style: resolve(parseRPr(kid(r, 'rPr'))) });
      }
    }
    const end = resolve(parseRPr(kid(p, 'endParaRPr')));
    const bu = P.bu?.type && P.bu.type !== 'none' ? P.bu : null;
    let bullet = null;
    if (bu && runs.some((r) => r.kind === 'text' && r.text.length)) {
      const first = runs.find((r) => r.kind === 'text')?.style || end;
      const color = P.buClr && P.buClr !== 'tx' ? dmlColor(P.buClr, env)?.color : first.color;
      const font = P.buFont && P.buFont !== 'tx' ? face(P.buFont) : first.font;
      bullet = { ...bu, color: color || first.color, font, size: P.buSz && P.buSz !== 'tx' ? P.buSz : { pct: 1 } };
    }
    return {
      lvl, algn: P.algn || 'l', marL: P.marL || 0, marR: P.marR || 0, indent: P.indent || 0, rtl: !!P.rtl,
      lnSpc: P.lnSpc || { pct: 1 }, spcBef: P.spcBef || null, spcAft: P.spcAft || null,
      defTab: P.defTabSz || 72, tabs: P.tabs || [], bullet, runs, end,
    };
  });
}

// ------------------------------------------------------------------ tables --
function tableStyleEl(model, id) {
  if (!id) return null;
  if (model.tableStyles) {
    for (const s of kids(model.tableStyles, 'tblStyle')) if (attr(s, 'styleId') === id) return s;
  }
  const xml = builtinTableStyle(id);
  return xml ? parseXml(xml).documentElement : null;
}

const PARTS = ['wholeTbl', 'band1H', 'band2H', 'band1V', 'band2V', 'lastCol', 'firstCol', 'lastRow', 'firstRow', 'seCell', 'swCell', 'neCell', 'nwCell'];
function parseTableStyle(el, ctx) {
  const out = {};
  if (!el) return out;
  for (const name of PARTS) {
    const p = kid(el, name);
    if (!p) continue;
    const tcStyle = kid(p, 'tcStyle');
    const tx = kid(p, 'tcTxStyle');
    const part = { borders: {}, fill: undefined, text: null };
    const fillEl = kid(tcStyle, 'fill');
    const fillRef = kid(tcStyle, 'fillRef');
    if (fillEl) part.fill = resolveFill(fillSpec(fillEl), ctx.env, ctx);
    else if (fillRef) part.fill = styleFill(num(attr(fillRef, 'idx')), colorChild(fillRef), ctx);
    for (const b of kids(kid(tcStyle, 'tcBdr'))) {
      const ln = kid(b, 'ln');
      const ref = kid(b, 'lnRef');
      if (ln) part.borders[b.localName] = resolveLine(lineSpec([{ el: ln }]), ctx.env);
      else if (ref) {
        const tl = ctx.M.fmt.ln[num(attr(ref, 'idx')) - 1];
        part.borders[b.localName] = tl ? resolveLine(lineSpec([{ el: tl, ph: dmlColor(colorChild(ref), ctx.env) }]), ctx.env) : null;
      }
    }
    if (tx) {
      const c = colorChild(tx) || colorChild(kid(tx, 'fontRef'));
      part.text = {
        bold: attr(tx, 'b') === 'on' ? true : attr(tx, 'b') === 'off' ? false : undefined,
        italic: attr(tx, 'i') === 'on' ? true : attr(tx, 'i') === 'off' ? false : undefined,
        color: c ? dmlColor(c, ctx.env) : null,
      };
    }
    out[name] = part;
  }
  return out;
}

function buildTable(tbl, box, ctx) {
  if (!tbl) return null;
  const tblPr = kid(tbl, 'tblPr');
  const flag = (k) => on(attr(tblPr, k));
  const flags = { firstRow: flag('firstRow'), lastRow: flag('lastRow'), firstCol: flag('firstCol'), lastCol: flag('lastCol'), bandRow: flag('bandRow'), bandCol: flag('bandCol') };
  const sid = kid(tblPr, 'tableStyleId')?.textContent?.trim() || null;
  const inline = kid(tblPr, 'tableStyle');
  const style = parseTableStyle(inline || tableStyleEl(ctx.model, sid), ctx);
  const tableFill = resolveFill(fillSpec(tblPr), ctx.env, ctx);
  const cols = kids(kid(tbl, 'tblGrid'), 'gridCol').map((c) => pt(attr(c, 'w')));
  const trs = kids(tbl, 'tr');
  const nR = trs.length;
  const nC = cols.length;
  const rows = trs.map((tr, r) => {
    const cells = [];
    let c = 0;
    for (const tc of kids(tr, 'tc')) {
      const tcPr = kid(tc, 'tcPr');
      const cell = {
        r, c, gridSpan: num(attr(tc, 'gridSpan'), 1), rowSpan: num(attr(tc, 'rowSpan'), 1),
        covered: on(attr(tc, 'hMerge')) || on(attr(tc, 'vMerge')),
        mar: { l: attr(tcPr, 'marL') != null ? pt(attr(tcPr, 'marL')) : 7.2, r: attr(tcPr, 'marR') != null ? pt(attr(tcPr, 'marR')) : 7.2, t: attr(tcPr, 'marT') != null ? pt(attr(tcPr, 'marT')) : 3.6, b: attr(tcPr, 'marB') != null ? pt(attr(tcPr, 'marB')) : 3.6 },
        anchor: attr(tcPr, 'anchor') || 't',
        vert: attr(tcPr, 'vert') || null,
      };
      // conditional formatting parts that apply to this cell, in increasing priority
      const parts = ['wholeTbl'];
      const dataRow = r - (flags.firstRow ? 1 : 0);
      const dataCol = c - (flags.firstCol ? 1 : 0);
      if (flags.bandCol && dataCol >= 0 && !(flags.lastCol && c === nC - 1)) parts.push(dataCol % 2 ? 'band2V' : 'band1V');
      if (flags.bandRow && dataRow >= 0 && !(flags.lastRow && r === nR - 1)) parts.push(dataRow % 2 ? 'band2H' : 'band1H');
      if (flags.lastCol && c + cell.gridSpan - 1 === nC - 1) parts.push('lastCol');
      if (flags.firstCol && c === 0) parts.push('firstCol');
      if (flags.lastRow && r + cell.rowSpan - 1 === nR - 1) parts.push('lastRow');
      if (flags.firstRow && r === 0) parts.push('firstRow');
      let fill = tableFill;
      const text = {};
      const bd = {};
      const edge = { top: r === 0, bottom: r + cell.rowSpan - 1 === nR - 1, left: c === 0, right: c + cell.gridSpan - 1 === nC - 1 };
      for (const name of parts) {
        const sp = style[name];
        if (!sp) continue;
        if (sp.fill !== undefined) fill = sp.fill;
        if (sp.text) for (const k of ['bold', 'italic', 'color']) if (sp.text[k] !== undefined && sp.text[k] !== null) text[k] = sp.text[k];
        const B = sp.borders;
        const whole = name === 'wholeTbl';
        // outer edges come from left/right/top/bottom, interior edges from insideH/insideV (whole table and bands)
        for (const side of ['top', 'bottom', 'left', 'right']) {
          const inside = side === 'top' || side === 'bottom' ? 'insideH' : 'insideV';
          const isEdge = edge[side];
          // region edge: the table edge for the whole table and bands; for first/last row parts their top and
          // bottom always bound the region, for first/last column parts their left and right do
          const rowPart = name === 'firstRow' || name === 'lastRow';
          const colPart = name === 'firstCol' || name === 'lastCol';
          const regionEdge = isEdge || (rowPart && (side === 'top' || side === 'bottom')) || (colPart && (side === 'left' || side === 'right'));
          if (whole || name.startsWith('band') || rowPart || colPart) {
            if (regionEdge && side in B) bd[side] = B[side];
            else if (!regionEdge && inside in B) bd[side] = B[inside];
          }
        }
      }
      // direct cell formatting
      const cf = fillSpec(tcPr);
      if (cf) fill = resolveFill(cf, ctx.env, ctx);
      for (const [side, k] of [['left', 'lnL'], ['right', 'lnR'], ['top', 'lnT'], ['bottom', 'lnB']]) {
        const ln = kid(tcPr, k);
        if (ln) bd[side] = resolveLine(lineSpec([{ el: ln }]), ctx.env);
      }
      cell.fill = fill;
      cell.borders = bd;
      // cell text: default/other text style, then the table style's text formatting
      const extra = [];
      if (text.bold !== undefined || text.italic !== undefined || text.color) {
        const rPr = {};
        if (text.bold !== undefined) rPr.bold = text.bold;
        if (text.italic !== undefined) rPr.italic = text.italic;
        if (text.color) rPr.fill = { kind: 'resolved', c: text.color };
        extra.push(new Array(9).fill({ rPr }));
      }
      cell.text = buildTextBody(tc, [], null, ctx, null, extra);
      cells.push(cell);
      c += 1;
    }
    return { h: pt(attr(tr, 'h')), cells };
  });
  return { kind: 'tbl', box, cols, rows };
}
