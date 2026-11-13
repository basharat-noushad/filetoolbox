// Workbook model -> paginated display lists (Excel print semantics: print area, fit-to-page, scale,
// column bands paged "down then over", repeated title rows, gridlines, header/footer codes).
import { KEY, formatCell } from './model.js';
import { drawChart } from '../common/chart.js';
import { DEFAULT_LIMITS, LimitError } from '../common/limits.js';

const PAPER = { 1: [612, 792], 3: [792, 1224], 5: [612, 1008], 8: [841.89, 1190.55], 9: [595.28, 841.89], 11: [419.53, 595.28], 13: [515.91, 728.5] };
const BORDER = {
  hair: { w: 0.25 }, thin: { w: 0.5 }, medium: { w: 1.0 }, thick: { w: 1.6 }, double: { w: 0.4, double: true },
  dotted: { w: 0.5, dash: [0.5, 1] }, dashed: { w: 0.5, dash: [2, 1.5] }, mediumDashed: { w: 1.0, dash: [3, 2] },
  dashDot: { w: 0.5, dash: [3, 1.5] }, mediumDashDot: { w: 1.0, dash: [3, 2] }, dashDotDot: { w: 0.5, dash: [3, 1.5] },
  mediumDashDotDot: { w: 1.0, dash: [3, 2] }, slantDashDot: { w: 1.0, dash: [3, 2] },
};
const PAD = 1.5; // pt, horizontal text inset at 100 %

const fontOf = (model, cell) => {
  const xf = model.styles.xfs[cell?.s ?? 0] || model.styles.xfs[0];
  return model.styles.fonts[xf.fontId] || model.defFont;
};
const rpOf = (f) => ({ font: f.name || 'Calibri', bold: !!f.bold, italic: !!f.italic });

/** font keys + characters per key, so FontBook can load exactly what's needed (and fallbacks only if required) */
export function collectFonts(model, extraText = '') {
  const keys = new Set();
  const chars = new Map();
  const add = (rp, text) => {
    const k = `${rp.font}|${rp.bold ? 1 : 0}|${rp.italic ? 1 : 0}`;
    keys.add(k);
    let s = chars.get(k);
    if (!s) chars.set(k, (s = new Set()));
    for (const ch of text) s.add(ch);
  };
  const def = rpOf(model.defFont);
  add(def, '0123456789#' + extraText);
  add({ ...def, bold: true }, '');
  for (const sh of model.sheets) {
    if (sh.hidden) continue;
    for (const cell of sh.cells.values()) {
      if (cell.v == null || cell.v === '') continue;
      cell._fmt = formatCell(cell, model);
      add(rpOf(fontOf(model, cell)), cell._fmt.text);
    }
    for (const d of sh.drawings) if (d.kind === 'chart') {
      const ch = d.chart;
      add(def, [ch.title || '', ...ch.categories.map(String), ...ch.series.map((s) => s.name), '0123456789.,-kM%…'].join(''));
      if (ch.title) add({ ...def, bold: true }, ch.title + '…');
    }
    add(def, sh.header + sh.footer + sh.name);
  }
  return { keys, chars };
}

export function layoutWorkbook(model, fonts, { filename = '' } = {}) {
  const pages = [];
  const def = rpOf(model.defFont);
  const defRec = fonts.get(def);
  // Excel column widths are in "characters" of the default font's widest digit (in pixels at 96 dpi)
  const pxSize = (model.defFont.size || 11) * 96 / 72;
  let mdw = 0;
  for (const d of '0123456789') mdw = Math.max(mdw, fonts.width(defRec, pxSize, d));
  mdw = Math.max(1, Math.round(mdw));
  for (const sh of model.sheets) if (!sh.hidden) layoutSheet(sh, model, fonts, mdw, pages);
  const total = pages.length;
  pages.forEach((p, i) => drawHeaderFooter(p, i + 1, total, model, fonts, filename));
  return { pages, width: pages[0]?.width || 595.28, height: pages[0]?.height || 841.89 };
}

function layoutSheet(sh, model, fonts, mdw, pages) {
  const S = model.styles;
  // ---- used / print range
  let rg = sh.printArea;
  if (!rg) {
    let r1 = Infinity;
    let c1 = Infinity;
    for (const cell of sh.cells.values()) {
      const visible = (cell.v != null && cell.v !== '') || boxStyled(S, cell.s);
      if (visible) { r1 = Math.min(r1, cell.r); c1 = Math.min(c1, cell.c); }
    }
    for (const m of sh.merges) { r1 = Math.min(r1, m.r1); c1 = Math.min(c1, m.c1); }
    for (const d of sh.drawings) if (d.from) { r1 = Math.min(r1, d.from.r); c1 = Math.min(c1, d.from.c); }
    if (sh.maxR < 0 || !Number.isFinite(r1)) return;
    rg = { r1, c1, r2: sh.maxR, c2: sh.maxC };
  }
  // ---- geometry
  const colPx = (w) => Math.trunc(((256 * w + Math.trunc(128 / mdw)) / 256) * mdw);
  const defColPx = sh.defaultColW != null ? colPx(sh.defaultColW) : sh.baseColW != null ? Math.trunc(sh.baseColW * mdw + 5) : Math.round((64 * mdw) / 7);
  const colW = (c) => (sh.colHidden.has(c) ? 0 : (sh.colW.has(c) ? colPx(sh.colW.get(c)) : defColPx) * 0.75);
  const byRow = new Map();
  for (const cell of sh.cells.values()) { if (!byRow.has(cell.r)) byRow.set(cell.r, []); byRow.get(cell.r).push(cell); }
  // merged ranges are looked up per cell instead of enumerated: a single <mergeCell ref="A1:XFD1048576"/>
  // would otherwise mean 17 billion Set entries
  const mergeAt = mergeIndex(sh, byRow, model.limits);
  const autoH = (r) => {
    let h = sh.defaultRowH;
    for (const cell of byRow.get(r) || []) {
      if (cell.v == null || cell.v === '') continue;
      const f = fontOf(model, cell);
      const rec = fonts.get(rpOf(f));
      const lh = (rec.asc + rec.desc) * f.size;
      let lines = 1;
      const xf = S.xfs[cell.s] || S.xfs[0];
      if (xf.wrap && !mergeAt(cell.r, cell.c)) lines = wrapText(fonts, rec, f.size, cell._fmt?.text ?? String(cell.v), Math.max(1, colW(cell.c) - 2 * PAD)).length;
      h = Math.max(h, lines * lh + 2);
    }
    return h;
  };
  const rowH = (r) => (sh.rowHidden.has(r) ? 0 : sh.rowH.get(r) ?? autoH(r));
  let maxC = rg.c2 + 1;
  let maxR = rg.r2 + 1;
  for (const d of sh.drawings) if (d.to) { maxC = Math.max(maxC, d.to.c + 1); maxR = Math.max(maxR, d.to.r + 1); }
  if (sh.titleRows && sh.titleRows[1] >= 0) maxR = Math.max(maxR, sh.titleRows[1] + 1); // title rows below the data
  const X = [0];
  for (let c = 0; c <= maxC + 1; c++) X.push(X[c] + colW(c));
  const Y = [0];
  for (let r = 0; r <= maxR + 1; r++) Y.push(Y[r] + rowH(r));
  // ---- page
  let [pw, ph] = PAPER[sh.page.paper] || PAPER[9];
  if (sh.page.landscape) [pw, ph] = [ph, pw];
  const M = sh.page.margins;
  const availW = pw - (M.l + M.r) * 72;
  const availH = ph - (M.t + M.b) * 72;
  const totalW = X[rg.c2 + 1] - X[rg.c1];
  const totalH = Y[rg.r2 + 1] - Y[rg.r1];
  let scale = sh.page.scale / 100;
  if (sh.page.fit) {
    scale = Math.min(1, sh.page.fitW > 0 ? (availW * sh.page.fitW) / Math.max(1, totalW) : Infinity, sh.page.fitH > 0 ? (availH * sh.page.fitH) / Math.max(1, totalH) : Infinity);
    if (!Number.isFinite(scale)) scale = 1;
  }
  scale = Math.max(0.1, Math.min(4, scale));
  // ---- bands
  const colBands = [];
  let start = rg.c1;
  let acc = 0;
  for (let c = rg.c1; c <= rg.c2; c++) {
    const w = colW(c) * scale;
    if (c > start && (acc + w > availW + 0.01 || sh.colBreaks.has(c))) { colBands.push([start, c - 1]); start = c; acc = 0; }
    acc += w;
  }
  colBands.push([start, rg.c2]);
  const titles = sh.titleRows;
  const titleH = titles ? (Y[titles[1] + 1] - Y[titles[0]]) * scale : 0;
  const rowBands = [];
  start = rg.r1;
  acc = 0;
  for (let r = rg.r1; r <= rg.r2; r++) {
    const h = rowH(r) * scale;
    const withTitles = titles && start > titles[1] ? titleH : 0;
    if (r > start && (acc + h + withTitles > availH + 0.01 || sh.rowBreaks.has(r))) { rowBands.push([start, r - 1]); start = r; acc = 0; }
    acc += h;
  }
  rowBands.push([start, rg.r2]);
  // Excel never prints blank pages: find the bands that hold a value, a filled/bordered cell or a drawing.
  // Only the used (column band, row band) pairs are collected - never the full grid of pairs, which for a
  // damaged sheet that claims a cell at IV65536 / XFD1048576 runs to millions (900 MB before this).
  const bandOf = (bands, v) => { let lo = 0; let hi = bands.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (bands[m][0] <= v) lo = m; else hi = m - 1; } return v >= bands[lo][0] && v <= bands[lo][1] ? lo : -1; };
  const PAIR = 2 ** 21; // > max band count (one band per row at most: 1,048,576 rows)
  const used = new Set();
  const room = MAX_PAGES - pages.length;
  const tooMany = () => new LimitError(`the workbook would print more than ${MAX_PAGES} pages`);
  const use = (a, b) => { used.add(a * PAIR + b); if (used.size > room) throw tooMany(); };
  const mark = (r, c) => { const a = bandOf(colBands, c); const b = bandOf(rowBands, r); if (a >= 0 && b >= 0) use(a, b); };
  for (const cell of sh.cells.values()) if ((cell.v != null && cell.v !== '') || boxStyled(S, cell.s)) mark(cell.r, cell.c);
  for (const m of sh.merges) mark(m.r1, m.c1);
  // a drawing marks every band its anchor range touches (as marking each of its cells did, without the cells)
  const bandSpan = (bands, v0, v1) => {
    let lo = bandOf(bands, Math.max(v0, bands[0][0]));
    let hi = bandOf(bands, Math.min(v1, bands[bands.length - 1][1]));
    return lo < 0 || hi < 0 || v0 > v1 ? null : [lo, hi];
  };
  for (const d of sh.drawings) {
    if (!d.from) continue;
    const cs = bandSpan(colBands, d.from.c, d.to?.c ?? d.from.c);
    const rs = bandSpan(rowBands, d.from.r, d.to?.r ?? d.from.r);
    if (cs && rs) for (let a = cs[0]; a <= cs[1]; a++) for (let b = rs[0]; b <= rs[1]; b++) use(a, b);
  }
  const overThenDown = sh.page.order === 'overThenDown';
  const keys = colBands.length * rowBands.length === 1 ? [0] : [...used];
  // print order: down then over (column band major) by default, over then down (row band major) if set
  const rank = (k) => (overThenDown ? (k % PAIR) * PAIR + Math.floor(k / PAIR) : k);
  keys.sort((x, y) => rank(x) - rank(y));
  const printed = keys.map((k) => [colBands[Math.floor(k / PAIR)], rowBands[k % PAIR]]);
  if (pages.length + printed.length > MAX_PAGES) throw tooMany();

  const ctx = { sh, model, fonts, S, X, Y, scale, colW, rowH, mdw, mergeAt };
  for (const [cb, rb] of printed) {
    const page = { width: pw, height: ph, items: [], sheet: sh };
    const bandW = (X[cb[1] + 1] - X[cb[0]]) * scale;
    const showTitles = titles && rb[0] > titles[1];
    const th = showTitles ? titleH : 0;
    const bandH = (Y[rb[1] + 1] - Y[rb[0]]) * scale;
    const x0 = M.l * 72 + (sh.page.hCenter ? Math.max(0, (availW - bandW) / 2) : 0);
    const y0 = M.t * 72 + (sh.page.vCenter ? Math.max(0, (availH - bandH - th) / 2) : 0);
    if (showTitles) drawBand(page.items, ctx, cb, titles, x0, y0);
    drawBand(page.items, ctx, cb, rb, x0, y0 + th);
    pages.push(page);
  }
}

const MAX_PAGES = 5000;

// Draw rows r0..r1 x cols c0..c1 with the band's top-left at (px, py).
function drawBand(items, ctx, [c0, c1], [r0, r1], px, py) {
  const { sh, model, fonts, S, X, Y, scale } = ctx;
  const sx = (c) => px + (X[c] - X[c0]) * scale;
  const sy = (r) => py + (Y[r] - Y[r0]) * scale;
  const clip = { x: sx(c0), y: sy(r0), w: (X[c1 + 1] - X[c0]) * scale, h: (Y[r1 + 1] - Y[r0]) * scale };
  if (clip.w <= 0 || clip.h <= 0) return;
  // merged ranges that intersect the band (each drawn once, clipped to the band); per-cell membership comes
  // from ctx.mergeAt, which answers the same question without enumerating the ranges' cells
  const bandMerges = sh.merges.filter((m) => !(m.r2 < r0 || m.r1 > r1 || m.c2 < c0 || m.c1 > c1));
  if (sh.page.grid) {
    // A band can span huge numbers of hidden (zero-size) rows/columns, whose lines all fall on the same
    // position; in that case draw each position once. (Normal bands keep the exact original output.)
    const dedupe = c1 - c0 > 4096 || r1 - r0 > 4096;
    for (let c = c0; c <= c1 + 1; c++) if (!dedupe || c === c0 || sx(c) !== sx(c - 1)) items.push({ t: 'line', x1: sx(c), y1: clip.y, x2: sx(c), y2: clip.y + clip.h, w: 0.25, color: '#000000' });
    for (let r = r0; r <= r1 + 1; r++) if (!dedupe || r === r0 || sy(r) !== sy(r - 1)) items.push({ t: 'line', x1: clip.x, y1: sy(r), x2: clip.x + clip.w, y2: sy(r), w: 0.25, color: '#000000' });
  }
  const isEmpty = (r, c) => { const k = sh.cells.get(KEY(r, c)); return !k || k.v == null || k.v === ''; };
  const drawCell = (cell, x, y, w, h, merge) => {
    const xf = S.xfs[cell.s] || S.xfs[0];
    const fill = S.fills[xf.fillId];
    if (fill && w > 0 && h > 0) items.push({ t: 'rect', x, y, w, h, fill: fill.color });
    const b = S.borders[xf.borderId];
    if (b) {
      const edge = (side, x1, y1, x2, y2) => {
        const spec = side && BORDER[side.style];
        if (!spec) return;
        const lw = spec.w * Math.max(0.6, scale);
        if (spec.double) {
          const dx = x1 === x2 ? 0.7 : 0;
          const dy = y1 === y2 ? 0.7 : 0;
          items.push({ t: 'line', x1: x1 - dx, y1: y1 - dy, x2: x2 - dx, y2: y2 - dy, w: lw, color: side.color });
          items.push({ t: 'line', x1: x1 + dx, y1: y1 + dy, x2: x2 + dx, y2: y2 + dy, w: lw, color: side.color });
        } else items.push({ t: 'line', x1, y1, x2, y2, w: lw, color: side.color, dash: spec.dash });
      };
      edge(b.left, x, y, x, y + h);
      edge(b.right, x + w, y, x + w, y + h);
      edge(b.top, x, y, x + w, y);
      edge(b.bottom, x, y + h, x + w, y + h);
    }
    if (cell.v == null || cell.v === '') return;
    const fmt = cell._fmt || formatCell(cell, model);
    const f = fontOf(model, cell);
    const rec = fonts.get(rpOf(f));
    const size = f.size * scale;
    const color = fmt.color || f.color || '#000000';
    const pad = PAD * scale;
    const indent = xf.indent * 3 * ctx.mdw * 0.75 * scale;
    let h0 = xf.h;
    if (h0 === 'general') h0 = fmt.isNum ? 'right' : fmt.isBool ? 'center' : 'left';
    if (h0 === 'centerContinuous' || h0 === 'distributed') h0 = 'center';
    if (h0 === 'fill' || h0 === 'justify') h0 = 'left';
    const innerW = Math.max(1, w - 2 * pad - indent);
    let lines;
    if (xf.wrap) lines = wrapText(fonts, rec, size, fmt.text, innerW);
    else {
      lines = [fmt.text.replace(/\r?\n/g, ' ')];
      if (fmt.isNum && fonts.width(rec, size, lines[0]) > innerW + 0.5) {
        const hw = fonts.width(rec, size, '#') || 1;
        lines = ['#'.repeat(Math.max(1, Math.floor(innerW / hw)))];
      }
    }
    const lh = (rec.asc + rec.desc) * size;
    const blockH = lines.length * lh;
    let by;
    if (xf.v === 'top') by = y + 1 * scale;
    else if (xf.v === 'center' || xf.v === 'distributed' || xf.v === 'justify') by = y + (h - blockH) / 2;
    else by = y + h - blockH - 1.5 * scale;
    // overflow region for single-line text that doesn't fit (spills into empty neighbours)
    let cx0 = x;
    let cx1 = x + w;
    if (!xf.wrap && !fmt.isNum && !merge) {
      const tw = fonts.width(rec, size, lines[0]) + 2 * pad;
      if (tw > w) {
        const grow = (dir) => {
          let c = cell.c + dir;
          let edgeX = dir > 0 ? cx1 : cx0;
          while (c >= c0 && c <= c1 && isEmpty(cell.r, c) && !ctx.mergeAt(cell.r, c) && (dir > 0 ? edgeX - cx0 : cx1 - edgeX) < tw) {
            edgeX += dir * ctx.colW(c) * scale;
            c += dir;
          }
          return edgeX;
        };
        if (h0 === 'left') cx1 = grow(1);
        else if (h0 === 'right') cx0 = grow(-1);
        else { cx1 = grow(1); cx0 = grow(-1); }
      }
    }
    const textClip = { x: Math.max(cx0, clip.x), y: Math.max(y, clip.y), w: Math.min(cx1, clip.x + clip.w) - Math.max(cx0, clip.x), h: Math.min(y + h, clip.y + clip.h) - Math.max(y, clip.y) };
    if (textClip.w <= 0 || textClip.h <= 0) return;
    lines.forEach((ln, i) => {
      const tw = fonts.width(rec, size, ln);
      let tx;
      if (h0 === 'right') tx = x + w - pad - tw;
      else if (h0 === 'center') tx = x + (w - tw) / 2;
      else tx = x + pad + indent;
      const base = by + i * lh + rec.asc * size;
      items.push({ t: 'text', x: tx, y: base, text: ln, rec, size, color, clip: textClip });
      if (f.underline) items.push({ t: 'line', x1: tx, x2: tx + tw, y1: base + size * 0.12, y2: base + size * 0.12, w: Math.max(0.3, size * 0.05), color });
      if (f.strike) items.push({ t: 'line', x1: tx, x2: tx + tw, y1: base - size * 0.28, y2: base - size * 0.28, w: Math.max(0.3, size * 0.05), color });
    });
  };
  // merged areas intersecting the band (drawn once, clipped to the band)
  for (const m of bandMerges) {
    const cell = sh.cells.get(KEY(m.r1, m.c1)) || { r: m.r1, c: m.c1, v: null, s: 0 };
    const x = sx(m.c1);
    const y = sy(m.r1);
    items.push({ t: 'group', clip, items: [] });
    const group = items[items.length - 1].items;
    const saved = items.length;
    drawCellInto(group, () => drawCell(cell, x, y, (X[m.c2 + 1] - X[m.c1]) * scale, (Y[m.r2 + 1] - Y[m.r1]) * scale, m), items, saved);
  }
  for (let r = r0; r <= r1; r++) {
    if (!ctx.rowH(r)) continue;
    for (const cell of byRowCached(sh, r)) {
      if (cell.c < c0 || cell.c > c1 || ctx.mergeAt(cell.r, cell.c)) continue;
      if (!ctx.colW(cell.c)) continue;
      drawCell(cell, sx(cell.c), sy(r), ctx.colW(cell.c) * scale, ctx.rowH(r) * scale, null);
    }
  }
  // pictures and charts anchored on the sheet
  for (const d of sh.drawings) {
    let ax;
    let ay;
    if (d.abs) { ax = d.abs.x; ay = d.abs.y; } else if (d.from) { ax = X[d.from.c] + d.from.cOff; ay = Y[d.from.r] + d.from.rOff; } else continue;
    let bx;
    let byy;
    if (d.to) { bx = X[d.to.c] + d.to.cOff; byy = Y[d.to.r] + d.to.rOff; } else if (d.ext) { bx = ax + d.ext.w; byy = ay + d.ext.h; } else continue;
    if (bx <= X[c0] || ax >= X[c1 + 1] || byy <= Y[r0] || ay >= Y[r1 + 1]) continue;
    const box = { x: px + (ax - X[c0]) * scale, y: py + (ay - Y[r0]) * scale, w: (bx - ax) * scale, h: (byy - ay) * scale };
    if (d.kind === 'image') items.push({ t: 'img', ...box, data: d.data, format: d.format, clip });
    else if (d.kind === 'chart') {
      const g = { t: 'group', clip, items: [] };
      const recBase = fonts.get(rpOf(model.defFont));
      drawChart(g.items, d.chart, box, {
        textScale: scale,
        measure: (s, size) => fonts.width(recBase, size, String(s)),
        text: (s, x, y, size, o = {}) => {
          const rec = o.bold ? fonts.get({ ...rpOf(model.defFont), bold: true }) : recBase;
          let str = String(s);
          const maxW = o.maxW || Infinity;
          while (str.length > 1 && fonts.width(rec, size, str) > maxW) str = str.slice(0, -2) + '…';
          const w = fonts.width(rec, size, str);
          const tx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
          g.items.push({ t: 'text', x: tx, y, text: str, rec, size, color: o.color || '#000000' });
        },
      });
      items.push(g);
    }
  }
}

/**
 * (r, c) -> the merged range covering that cell, or null. Only rows that hold cells are ever asked about
 * (all callers start from a cell), so each merge is registered on those rows only and found by binary
 * search on its first column - no enumeration of the merged area. Total registrations are bounded.
 */
function mergeIndex(sh, byRow, limits = DEFAULT_LIMITS) {
  if (!sh.merges.length) return () => null;
  const rows = [...byRow.keys()].sort((a, b) => a - b);
  const byR = new Map();
  const budget = limits.maxCells * 2;
  let work = 0;
  for (const m of sh.merges) {
    let lo = 0;
    let hi = rows.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (rows[mid] < m.r1) lo = mid + 1; else hi = mid; }
    for (let i = lo; i < rows.length && rows[i] <= m.r2; i++) {
      if (++work > budget) throw new LimitError(`the sheet has more than ${budget} merged cells with content`);
      let list = byR.get(rows[i]);
      if (!list) byR.set(rows[i], (list = []));
      list.push(m);
    }
  }
  for (const list of byR.values()) list.sort((a, b) => a.c1 - b.c1);
  return (r, c) => {
    const list = byR.get(r);
    if (!list) return null;
    let lo = 0;
    let hi = list.length - 1;
    if (list[0].c1 > c) return null;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (list[mid].c1 <= c) lo = mid; else hi = mid - 1; }
    // merges don't overlap in valid files; for damaged ones also look at a few earlier (wider) ranges
    for (let i = lo; i >= 0 && i > lo - 8; i--) if (list[i].c2 >= c) return list[i];
    return null;
  };
}

function drawCellInto(group, fn, items, saved) {
  // run fn (which pushes to `items`) and move what it produced into `group`
  fn();
  group.push(...items.splice(saved));
}

const rowCache = new WeakMap();
function byRowCached(sh, r) {
  let m = rowCache.get(sh);
  if (!m) {
    m = new Map();
    for (const cell of sh.cells.values()) { if (!m.has(cell.r)) m.set(cell.r, []); m.get(cell.r).push(cell); }
    for (const list of m.values()) list.sort((a, b) => a.c - b.c);
    rowCache.set(sh, m);
  }
  return m.get(r) || [];
}

function boxStyled(S, s) {
  const xf = S.xfs[s];
  if (!xf) return false;
  const b = S.borders[xf.borderId];
  return !!(S.fills[xf.fillId] || (b && (b.left || b.right || b.top || b.bottom)));
}

export function wrapText(fonts, rec, size, text, maxW) {
  const out = [];
  for (const para of String(text).split(/\r?\n/)) {
    const words = para.split(/(\s+)/);
    let line = '';
    for (const w of words) {
      if (!w) continue;
      const cand = line + w;
      if (line && fonts.width(rec, size, cand.trimEnd()) > maxW) {
        out.push(line.trimEnd());
        line = /^\s+$/.test(w) ? '' : w;
      } else line = cand;
    }
    out.push(line.trimEnd());
  }
  return out.length ? out : [''];
}

// &L &C &R sections; &P page, &N pages, &A sheet, &F file, &D date, &T time, && literal
function drawHeaderFooter(page, n, total, model, fonts, filename) {
  const sh = page.sheet;
  delete page.sheet;
  if (!sh.header && !sh.footer) return;
  const rec = fonts.get(rpOf(model.defFont));
  const M = sh.page.margins;
  const put = (spec, baseline) => {
    const sections = { L: '', C: '', R: '' };
    let cur = 'C';
    let size = model.defFont.size || 11;
    for (let i = 0; i < spec.length; i++) {
      const ch = spec[i];
      if (ch !== '&') { sections[cur] += ch; continue; }
      const c2 = spec[++i];
      if (c2 === 'L' || c2 === 'C' || c2 === 'R') cur = c2;
      else if (c2 === 'P') sections[cur] += String(n);
      else if (c2 === 'N') sections[cur] += String(total);
      else if (c2 === 'A') sections[cur] += sh.name;
      else if (c2 === 'F') sections[cur] += filename;
      else if (c2 === 'D') sections[cur] += new Date().toLocaleDateString('en-GB');
      else if (c2 === 'T') sections[cur] += new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      else if (c2 === '&') sections[cur] += '&';
      else if (c2 === '"') { while (i + 1 < spec.length && spec[++i] !== '"'); }
      else if (/\d/.test(c2)) { let d = c2; while (/\d/.test(spec[i + 1])) d += spec[++i]; size = Number(d) || size; }
    }
    for (const [k, txt] of Object.entries(sections)) {
      if (!txt) continue;
      const w = fonts.width(rec, size, txt);
      const x = k === 'L' ? M.l * 72 : k === 'R' ? page.width - M.r * 72 - w : (page.width - w) / 2;
      page.items.push({ t: 'text', x, y: baseline(size), text: txt, rec, size, color: '#000000' });
    }
  };
  if (sh.header) put(sh.header, (s) => M.h * 72 + rec.asc * s);
  if (sh.footer) put(sh.footer, (s) => page.height - M.f * 72 - rec.desc * s);
}
