// PDF -> .xlsx: one sheet per page. Ruled tables become real cell grids (merges, fills, borders);
// borderless column layouts are split on the whitespace between columns; other text goes in column A.
// Numbers, percentages and currency become numeric cells with a matching number format.
import { extractPdf, scanStats } from '../pdf2docx/extract.js';
import { buildLines, detectTables, markDecorations, buildTable } from '../pdf2docx/analyze.js';
import { writeXlsx } from '../common/xlsx-writer.js';

export async function pdfToXlsx(bytes, { pdfjs, maxPages, pdfOptions, limits, ocr, onProgress } = {}) {
  const extracted = await extractPdf(bytes, { pdfjs, maxPages, pdfOptions, limits, ocr, onProgress });
  const { pages } = extracted;
  const stats = { pages: pages.length, tables: 0, numericCells: 0, textCells: 0, ...scanStats(extracted) };
  const sheets = pages.map((p, i) => pageToSheet(p, i, stats));
  return { xlsx: writeXlsx({ sheets }), stats };
}

const CUR = /^([$€£¥₹₨]|Rs\.?|AUD|USD|PKR)\s?/;
/** "12,480" -> {v:12480, fmt:'#,##0'}; "18.0%" -> {v:0.18, fmt:'0.0%'}; "(1,234.50)" -> negative; IDs stay text */
export function parseNumber(text) {
  let s = String(text).trim();
  if (!s || s.length > 24) return null;
  const orig = s;
  let neg = false;
  let plus = false;
  const paren = /^\(.*\)$/.test(s);
  if (paren) { neg = true; s = s.slice(1, -1).trim(); }
  if (/^[-−–]/.test(s)) { neg = !neg; s = s.slice(1).trim(); } else if (s.startsWith('+')) { plus = true; s = s.slice(1).trim(); }
  let cur = null;
  const m = CUR.exec(s);
  if (m) { cur = m[1]; s = s.slice(m[0].length).trim(); }
  let pct = false;
  if (s.endsWith('%')) { pct = true; s = s.slice(0, -1).trim(); }
  if (!/^(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/.test(s)) return null;
  const intPart = s.split('.')[0].replace(/,/g, '');
  if (intPart.length > 1 && intPart.startsWith('0')) return null; // leading zero: an identifier, keep as text
  if (s.replace(/[,.]/g, '').length > 15) return null; // beyond double precision: IDs, card/Medicare numbers
  const dec = (s.split('.')[1] || '').length;
  let v = Number(s.replace(/,/g, ''));
  if (neg) v = -v;
  const d = dec ? '.' + '0'.repeat(dec) : '';
  let fmt;
  if (pct) { v /= 100; fmt = `0${d}%`; } else if (cur) fmt = `"${cur}"#,##0${d}`;
  else fmt = s.includes(',') ? `#,##0${d}` : dec ? `0${d}` : null;
  if (plus && fmt) fmt = `+${fmt};-${fmt}`;
  else if (paren) fmt = `${fmt || '#,##0'};(${fmt || '#,##0'})`;
  return { v: Object.is(v, -0) ? 0 : v, fmt, orig };
}

// split a line on wide gaps (column boundaries) into segments of text
function segments(ln) {
  const out = [];
  let cur = null;
  let prev = null;
  for (const t of ln.tokens) {
    if (t.space) { if (cur) cur.text += ' '; continue; }
    if (!cur || (prev && t.x0 - prev.x1 > 1.2 * Math.max(t.size, prev.size))) {
      if (cur) cur.text = cur.text.trim();
      cur = { x0: t.x0, x1: t.x1, text: '', glyphs: [] };
      out.push(cur);
    }
    cur.text += t.ch >= '\uf000' && t.ch <= '\uf0ff' ? '•' : t.ch; // symbol-font bullets
    cur.x1 = Math.max(cur.x1, t.x1);
    cur.glyphs.push(t);
    prev = t;
  }
  if (cur) cur.text = cur.text.trim();
  return out;
}

function styleFromGlyphs(gs, bodySize) {
  const solid = gs.filter((g) => !g.space);
  if (!solid.length) return null;
  const st = {};
  if (solid.every((g) => g.bold)) st.bold = true;
  if (solid.every((g) => g.italic)) st.italic = true;
  const size = Math.round(solid[0].size * 2) / 2;
  if (Math.abs(size - bodySize) > 0.6) st.size = size;
  const c = solid[0].color;
  if (c && !/^#0{6}$/i.test(c) && solid.every((g) => g.color === c)) st.color = c;
  return Object.keys(st).length ? st : null;
}

function typed(text, style) {
  const n = parseNumber(text);
  if (n) return { v: n.v, style: n.fmt ? { ...(style || {}), numFmt: n.fmt } : style, numeric: true };
  return { v: text, style, numeric: false };
}

function pageToSheet(p, index, stats) {
  const tables = detectTables(p);
  const used = new Set(tables.flatMap((t) => t.segs));
  markDecorations(p, used);
  const inTable = new Set();
  for (const t of tables) for (const g of p.glyphs) {
    const cx = (g.x0 + g.x1) / 2;
    const cy = g.y - g.size * 0.3;
    if (cx > t.x0 && cx < t.x1 && cy > t.y0 && cy < t.y1) { t.glyphs.push(g); inTable.add(g); }
  }
  const lines = buildLines(p.glyphs.filter((g) => !inTable.has(g) && !g.rotated));
  const sizes = lines.flatMap((l) => l.glyphs.map((g) => Math.round(g.size * 2) / 2));
  const bodySize = mode(sizes) || 11;
  const left = Math.min(...lines.map((l) => l.x0), ...tables.map((t) => t.x0), p.width);
  const col = { left, right: p.width - left };
  const blocks = [
    ...tables.map((t) => ({ kind: 'table', top: t.y0, bottom: t.y1, tb: buildTable(t, col) })),
    ...lines.map((ln) => ({ kind: 'line', top: ln.y - ln.asc, bottom: ln.y + ln.desc, ln, segs: segments(ln) })),
  ].sort((a, b) => a.top - b.top);
  // borderless tables: runs of consecutive lines that split into 2+ columns
  const regions = [];
  let reg = null;
  const mergeIv = (cols, a, z) => {
    const out = [];
    for (const iv of [...cols, [a, z]].sort((p, q) => p[0] - q[0])) {
      const last = out[out.length - 1];
      if (last && iv[0] <= last[1] + 2) last[1] = Math.max(last[1], iv[1]); else out.push([...iv]);
    }
    return out;
  };
  // a line that would bridge the gap between two existing columns belongs to a different layout
  const fits = (r, segs) => segs.every((s) => r.cols.filter(([a, z]) => s.x1 > a - 1 && s.x0 < z + 1).length <= 1);
  for (const b of blocks) {
    const multi = b.kind === 'line' && b.segs.length >= 2;
    const close = reg && b.top - reg.bottom < 2.2 * (b.bottom - b.top);
    if (multi && close && fits(reg, b.segs)) { reg.blocks.push(b); reg.bottom = b.bottom; }
    else if (multi) { reg = { blocks: [b], bottom: b.bottom, cols: [] }; regions.push(reg); }
    else reg = null;
    if (multi) { b.region = reg; for (const sg of b.segs) reg.cols = mergeIv(reg.cols, sg.x0, sg.x1); }
  }
  for (const r of regions) if (r.cols.length >= 2) stats.tables++;
  const rows = [];
  const merges = [];
  const width = [];
  const want = (c, chars) => { width[c] = Math.max(width[c] || 0, Math.min(60, Math.max(4, chars))); };
  const put = (cells) => { rows.push({ cells }); };
  let lastBottom = null;
  let lastH = bodySize * 1.2;
  for (const b of blocks) {
    if (lastBottom != null && b.top - lastBottom > Math.max(lastH, bodySize) * 1.1) rows.push(null); // keep visual separation
    if (b.kind === 'table') {
      stats.tables++;
      const tb = b.tb;
      const r0 = rows.length;
      tb.colWidths.forEach((w, c) => want(c, w / 5.25));
      tb.rows.forEach((row) => {
        const cells = [];
        for (const cell of row.cells) {
          const text = cell.paras.map((pa) => pa.runs.map((r) => r.text).join('')).join('\n').trim();
          const firstRun = cell.paras[0]?.runs[0];
          let st = {};
          if (firstRun) {
            const all = cell.paras.flatMap((pa) => pa.runs);
            if (all.every((r) => r.bold)) st.bold = true;
            if (all.every((r) => r.italic)) st.italic = true;
            if (firstRun.color && !/^#0{6}$/i.test(firstRun.color)) st.color = firstRun.color;
            if (Math.abs(firstRun.size - bodySize) > 0.6) st.size = Math.round(firstRun.size * 2) / 2;
          }
          if (cell.fill) st.fill = cell.fill;
          const bd = cell.borders;
          if (bd.top || bd.bottom || bd.left || bd.right) st.border = bd;
          const al = cell.paras[0]?.align;
          if (al === 'center' || al === 'right') st.h = al;
          if (text.includes('\n')) st.wrap = true;
          if (!Object.keys(st).length) st = null;
          const tv = text.includes('\n') ? { v: text, style: st, numeric: false } : typed(text, st);
          if (tv.numeric && st?.h === 'right') delete tv.style.h;
          tv.numeric ? stats.numericCells++ : text && stats.textCells++;
          cells.push({ c: cell.col, v: tv.v, style: tv.style });
          if (cell.vMerge !== 'continue') {
            let r2 = rows.length;
            if (cell.vMerge === 'restart') {
              let k = tb.rows.indexOf(row) + 1;
              while (k < tb.rows.length && tb.rows[k].cells.some((x) => x.col === cell.col && x.vMerge === 'continue')) { r2++; k++; }
            }
            if (cell.span > 1 || r2 > rows.length) merges.push({ r1: rows.length, c1: cell.col, r2, c2: cell.col + cell.span - 1 });
          }
        }
        put(cells);
      });
      void r0;
    } else if (b.region && b.region.cols.length >= 2) {
      const cols = b.region.cols;
      const cells = [];
      for (const s of b.segs) {
        const cx = (s.x0 + s.x1) / 2;
        let c = cols.findIndex(([a, z]) => cx >= a - 1 && cx <= z + 1);
        if (c < 0) c = 0;
        const tv = typed(s.text, styleFromGlyphs(s.glyphs, bodySize));
        tv.numeric ? stats.numericCells++ : stats.textCells++;
        const prev = cells.find((x) => x.c === c);
        if (prev && !tv.numeric) prev.v = `${prev.v} ${s.text}`;
        else cells.push({ c, v: tv.v, style: tv.style });
        want(c, s.text.length * 1.15 + 1);
      }
      put(cells);
    } else {
      const text = b.segs.map((s) => s.text).join('   ');
      const tv = typed(text, styleFromGlyphs(b.ln.glyphs, bodySize));
      tv.numeric ? stats.numericCells++ : stats.textCells++;
      put([{ c: 0, v: tv.v, style: tv.style }]);
    }
    lastBottom = b.bottom;
    lastH = b.bottom - b.top;
  }
  const cols = [];
  for (let c = 0; c < width.length; c++) cols.push(width[c] ? Math.round(width[c] * 10) / 10 : null);
  return { name: `Page ${index + 1}`, cols, rows, merges };
}

function mode(arr) {
  const m = new Map();
  for (const v of arr) m.set(v, (m.get(v) || 0) + 1);
  let best = null;
  let bc = 0;
  for (const [k, c] of m) if (c > bc) { best = k; bc = c; }
  return best;
}
