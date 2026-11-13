// .xlsx (SpreadsheetML) -> workbook model: cells, styles, number formats, merges, print setup, drawings.
import SSF from 'ssf';
import { openPackage } from '../common/ooxml.js';
import { DamagedError, LimitError, clampInt } from '../common/limits.js';
import { kid, kids, attr, descendants, num } from '../common/xml.js';
import { INDEXED, applyTint, parseThemePart } from '../common/color.js';
import { parseChart } from '../common/chart.js';

const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
export const KEY = (r, c) => r * 20000 + c;

export function colIndex(letters) {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
export function parseRef(ref) {
  const m = /^\$?([A-Z]{1,3})\$?(\d+)$/i.exec(ref.trim());
  return m ? { c: colIndex(m[1]), r: Number(m[2]) - 1 } : null;
}
// Excel's grid: 1,048,576 rows x 16,384 columns (XFD). Anything beyond comes from a damaged file.
export const MAX_ROW = 1048575;
export const MAX_COL = 16383;
/** a parsed range clipped to the grid, or null if it lies entirely outside */
export function clipRange(rg, maxR = MAX_ROW, maxC = MAX_COL) {
  if (!rg || rg.r1 > maxR || rg.c1 > maxC || rg.r2 < 0 || rg.c2 < 0) return null;
  return { r1: Math.max(0, rg.r1), c1: Math.max(0, rg.c1), r2: Math.min(maxR, rg.r2), c2: Math.min(maxC, rg.c2) };
}
export function parseRange(ref) {
  const [a, b] = ref.split(':');
  const p = parseRef(a);
  const q = b ? parseRef(b) : p;
  if (!p || !q) return null;
  return { r1: Math.min(p.r, q.r), c1: Math.min(p.c, q.c), r2: Math.max(p.r, q.r), c2: Math.max(p.c, q.c) };
}
const unescapeX = (s) => s.replace(/_x([0-9A-Fa-f]{4})_/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

function colorOf(el, theme) {
  if (!el) return null;
  if (attr(el, 'auto') === '1' || attr(el, 'auto') === 'true') return null;
  let hex = null;
  const rgb = attr(el, 'rgb');
  if (rgb) hex = '#' + rgb.slice(-6).toUpperCase();
  else if (attr(el, 'theme') != null) {
    const order = ['lt1', 'dk1', 'lt2', 'dk2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];
    hex = theme[order[num(attr(el, 'theme'))]] || null;
  } else if (attr(el, 'indexed') != null) {
    const i = num(attr(el, 'indexed'));
    hex = i === 64 ? '#000000' : i === 65 ? '#FFFFFF' : INDEXED[i] || null;
  }
  if (hex && attr(el, 'tint')) hex = applyTint(hex, num(attr(el, 'tint')));
  return hex;
}

function parseStyles(doc, theme) {
  const S = { numFmts: new Map(), fonts: [], fills: [], borders: [], xfs: [] };
  if (!doc) return S;
  const root = doc.documentElement;
  for (const f of descendants(root, 'numFmt')) S.numFmts.set(num(attr(f, 'numFmtId')), attr(f, 'formatCode'));
  for (const f of kids(kid(root, 'fonts'), 'font')) {
    const on = (n) => { const e = kid(f, n); return !!e && attr(e, 'val') !== '0' && attr(e, 'val') !== 'false'; };
    S.fonts.push({
      name: attr(kid(f, 'name'), 'val') || 'Calibri', size: num(attr(kid(f, 'sz'), 'val'), 11),
      bold: on('b'), italic: on('i'), strike: on('strike'),
      underline: !!kid(f, 'u') && attr(kid(f, 'u'), 'val') !== 'none',
      color: colorOf(kid(f, 'color'), theme), vertAlign: attr(kid(f, 'vertAlign'), 'val'),
    });
  }
  for (const f of kids(kid(root, 'fills'), 'fill')) {
    const p = kid(f, 'patternFill');
    const type = attr(p, 'patternType');
    if (p && type && type !== 'none' && type !== 'gray125') {
      const fg = colorOf(kid(p, 'fgColor'), theme) || colorOf(kid(p, 'bgColor'), theme);
      S.fills.push(fg ? { color: fg, solid: type === 'solid' } : null);
    } else {
      const g = kid(f, 'gradientFill');
      const stop = g && kid(kid(g, 'stop'), 'color');
      S.fills.push(stop ? { color: colorOf(stop, theme), solid: true } : null);
    }
  }
  for (const b of kids(kid(root, 'borders'), 'border')) {
    const side = (n) => {
      const e = kid(b, n);
      const style = attr(e, 'style');
      return style && style !== 'none' ? { style, color: colorOf(kid(e, 'color'), theme) || '#000000' } : null;
    };
    S.borders.push({ left: side('left') || side('start'), right: side('right') || side('end'), top: side('top'), bottom: side('bottom') });
  }
  for (const x of kids(kid(root, 'cellXfs'), 'xf')) {
    const a = kid(x, 'alignment');
    S.xfs.push({
      numFmtId: num(attr(x, 'numFmtId')), fontId: num(attr(x, 'fontId')), fillId: num(attr(x, 'fillId')), borderId: num(attr(x, 'borderId')),
      h: attr(a, 'horizontal') || 'general', v: attr(a, 'vertical') || 'bottom', wrap: attr(a, 'wrapText') === '1' || attr(a, 'wrapText') === 'true',
      indent: num(attr(a, 'indent')), rot: num(attr(a, 'textRotation')), shrink: attr(a, 'shrinkToFit') === '1' || attr(a, 'shrinkToFit') === 'true',
    });
  }
  if (!S.xfs.length) S.xfs.push({ numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, h: 'general', v: 'bottom', wrap: false, indent: 0, rot: 0 });
  if (!S.fonts.length) S.fonts.push({ name: 'Calibri', size: 11 });
  return S;
}

function parseSharedStrings(doc) {
  if (!doc) return [];
  return kids(doc.documentElement, 'si').map((si) => {
    const t = kid(si, 't');
    if (t) return unescapeX(t.textContent);
    return unescapeX(kids(si, 'r').map((r) => kid(r, 't')?.textContent || '').join(''));
  });
}

function parseDefinedNames(wb) {
  const out = [];
  for (const d of descendants(wb.documentElement, 'definedName')) {
    out.push({ name: attr(d, 'name'), sheet: attr(d, 'localSheetId') != null ? num(attr(d, 'localSheetId')) : null, ref: d.textContent });
  }
  return out;
}

// "'My Sheet'!$A$1:$F$20,Other!$1:$1" -> [{ sheet, range }]
function splitRefs(text) {
  const parts = [];
  for (const part of text.match(/(?:'[^']*(?:''[^']*)*'|[^,!])+!\$?[A-Z]*\$?\d*(?::\$?[A-Z]*\$?\d*)?/gi) || []) {
    const i = part.lastIndexOf('!');
    parts.push({ sheet: part.slice(0, i).replace(/^'|'$/g, '').replace(/''/g, "'"), ref: part.slice(i + 1).replace(/\$/g, '') });
  }
  return parts;
}

const PAPER = { 1: [612, 792], 3: [792, 1224], 5: [612, 1008], 8: [841.89, 1190.55], 9: [595.28, 841.89], 11: [419.53, 595.28], 13: [515.91, 728.5] };

export function loadXlsx(bytes, { maxCells, limits } = {}) {
  const pkg = openPackage(bytes, limits);
  maxCells ??= pkg.limits.maxCells;
  const wbRels = pkg.rels(pkg.main);
  const byType = (s) => { for (const r of wbRels.values()) if (r.type === REL + s) return r.target; return null; };
  const theme = parseThemePart(pkg.xml(byType('theme') || 'xl/theme/theme1.xml'));
  const styles = parseStyles(pkg.xml(byType('styles') || 'xl/styles.xml'), theme);
  const strings = parseSharedStrings(pkg.xml(byType('sharedStrings') || 'xl/sharedStrings.xml'));
  const wb = pkg.xml(pkg.main);
  if (!wb) throw new DamagedError(`Not a readable Excel file (no workbook: ${pkg.main} is missing or damaged)`);
  const date1904 = ['1', 'true'].includes(attr(descendants(wb.documentElement, 'workbookPr')[0], 'date1904'));
  const names = parseDefinedNames(wb);
  const sheetEls = descendants(wb.documentElement, 'sheet');
  let cellCount = 0;
  const sheets = sheetEls.map((se, idx) => {
    const name = attr(se, 'name');
    const rel = wbRels.get(attr(se, 'r:id'));
    const sh = {
      name, hidden: ['hidden', 'veryHidden'].includes(attr(se, 'state')), cells: new Map(), merges: [],
      colW: new Map(), colHidden: new Set(), rowH: new Map(), rowHidden: new Set(), rowCustom: new Set(),
      defaultColW: null, defaultRowH: 15, maxR: -1, maxC: -1, drawings: [], rowBreaks: new Set(), colBreaks: new Set(),
      page: { paper: 9, landscape: false, scale: 100, fit: false, fitW: 1, fitH: 1, order: 'downThenOver', margins: { l: 0.7, r: 0.7, t: 0.75, b: 0.75, h: 0.3, f: 0.3 }, hCenter: false, vCenter: false, grid: false, firstPage: null },
      header: '', footer: '', printArea: null, titleRows: null, titleCols: null,
    };
    const doc = rel && pkg.xml(rel.target);
    if (!doc) return sh;
    const root = doc.documentElement;
    const fmt = kid(root, 'sheetFormatPr');
    if (attr(fmt, 'defaultRowHeight')) sh.defaultRowH = num(attr(fmt, 'defaultRowHeight'), 15);
    if (attr(fmt, 'defaultColWidth')) sh.defaultColW = num(attr(fmt, 'defaultColWidth'));
    else if (attr(fmt, 'baseColWidth')) sh.baseColW = num(attr(fmt, 'baseColWidth'));
    for (const col of kids(kid(root, 'cols'), 'col')) {
      const a = Math.max(0, num(attr(col, 'min')) - 1); // file-supplied: min="-1e9" would loop a billion times
      const b = Math.min(num(attr(col, 'max')) - 1, 16383);
      for (let c = a; c <= b; c++) {
        if (attr(col, 'width') != null) sh.colW.set(c, num(attr(col, 'width')));
        if (attr(col, 'hidden') === '1' || attr(col, 'hidden') === 'true') sh.colHidden.add(c);
      }
    }
    for (const row of kids(kid(root, 'sheetData'), 'row')) {
      const r = num(attr(row, 'r')) - 1;
      if (r > MAX_ROW) continue; // beyond Excel's grid: a damaged file, and X/Y arrays would follow it
      if (attr(row, 'ht') != null) sh.rowH.set(r, num(attr(row, 'ht')));
      if (attr(row, 'customHeight') === '1' || attr(row, 'customHeight') === 'true') sh.rowCustom.add(r);
      if (attr(row, 'hidden') === '1' || attr(row, 'hidden') === 'true') sh.rowHidden.add(r);
      let cAuto = 0;
      for (const c of kids(row, 'c')) {
        const ref = attr(c, 'r');
        const pos = (ref && parseRef(ref)) || { r, c: cAuto };
        cAuto = pos.c + 1;
        if (pos.r < 0 || pos.c < 0 || pos.r > MAX_ROW || pos.c > MAX_COL) continue; // outside the grid
        const t = attr(c, 't') || 'n';
        const s = num(attr(c, 's'));
        const vEl = kid(c, 'v');
        let v = vEl ? vEl.textContent : null;
        if (t === 's') v = v != null ? strings[num(v)] ?? '' : null;
        else if (t === 'inlineStr') v = unescapeX(descendants(kid(c, 'is'), 't').map((x) => x.textContent).join(''));
        else if (t === 'b') v = v === '1';
        else if (t === 'n' && v != null && v !== '') v = Number(v);
        else if (t === 'd' && v) v = dateToSerial(v, date1904);
        else if (t === 'str' || t === 'e') v = v ?? '';
        if (v === '' && t === 'n') v = null;
        if (v == null && !s) continue;
        if (++cellCount > maxCells) throw new Error(`workbook has more than ${maxCells} cells`);
        sh.cells.set(KEY(pos.r, pos.c), { r: pos.r, c: pos.c, v, t: t === 'd' ? 'n' : t, s, f: !!kid(c, 'f') });
        if (v != null && v !== '') { sh.maxR = Math.max(sh.maxR, pos.r); sh.maxC = Math.max(sh.maxC, pos.c); }
        else if (styledBox(styles, s)) { sh.maxR = Math.max(sh.maxR, pos.r); sh.maxC = Math.max(sh.maxC, pos.c); }
      }
    }
    for (const m of descendants(kid(root, 'mergeCells'), 'mergeCell')) {
      const rg = clipRange(parseRange(attr(m, 'ref') || ''));
      if (rg) {
        if (sh.merges.length >= pkg.limits.maxMerges) throw new LimitError(`a sheet has more than ${pkg.limits.maxMerges} merged ranges`);
        sh.merges.push(rg); sh.maxR = Math.max(sh.maxR, rg.r2); sh.maxC = Math.max(sh.maxC, rg.c2);
      }
    }
    const pm = kid(root, 'pageMargins');
    if (pm) for (const [k, a] of [['l', 'left'], ['r', 'right'], ['t', 'top'], ['b', 'bottom'], ['h', 'header'], ['f', 'footer']]) if (attr(pm, a) != null) sh.page.margins[k] = num(attr(pm, a));
    const ps = kid(root, 'pageSetup');
    if (ps) {
      if (attr(ps, 'paperSize')) sh.page.paper = num(attr(ps, 'paperSize'), 9);
      sh.page.landscape = attr(ps, 'orientation') === 'landscape';
      if (attr(ps, 'scale')) sh.page.scale = num(attr(ps, 'scale'), 100);
      if (attr(ps, 'fitToWidth') != null) sh.page.fitW = num(attr(ps, 'fitToWidth'), 1);
      if (attr(ps, 'fitToHeight') != null) sh.page.fitH = num(attr(ps, 'fitToHeight'), 1);
      if (attr(ps, 'pageOrder')) sh.page.order = attr(ps, 'pageOrder');
      if (attr(ps, 'useFirstPageNumber') === '1' && attr(ps, 'firstPageNumber')) sh.page.firstPage = num(attr(ps, 'firstPageNumber'));
    }
    const sp = descendants(kid(root, 'sheetPr'), 'pageSetUpPr')[0];
    sh.page.fit = ['1', 'true'].includes(attr(sp, 'fitToPage'));
    const po = kid(root, 'printOptions');
    if (po) {
      sh.page.grid = ['1', 'true'].includes(attr(po, 'gridLines'));
      sh.page.hCenter = ['1', 'true'].includes(attr(po, 'horizontalCentered'));
      sh.page.vCenter = ['1', 'true'].includes(attr(po, 'verticalCentered'));
    }
    for (const b of descendants(kid(root, 'rowBreaks'), 'brk')) sh.rowBreaks.add(num(attr(b, 'id')));
    for (const b of descendants(kid(root, 'colBreaks'), 'brk')) sh.colBreaks.add(num(attr(b, 'id')));
    const hf = kid(root, 'headerFooter');
    if (hf) { sh.header = kid(hf, 'oddHeader')?.textContent || ''; sh.footer = kid(hf, 'oddFooter')?.textContent || ''; }
    for (const dn of names) {
      const local = dn.sheet === idx;
      for (const p of splitRefs(dn.ref)) {
        if (p.sheet !== name && !local) continue;
        if (dn.name === '_xlnm.Print_Area' && !sh.printArea) sh.printArea = clipRange(parseRange(p.ref));
        if (dn.name === '_xlnm.Print_Titles') {
          const m = /^(\d+):(\d+)$/.exec(p.ref);
          if (m) sh.titleRows = [Math.min(MAX_ROW, Number(m[1]) - 1), Math.min(MAX_ROW, Number(m[2]) - 1)];
          const k = /^([A-Z]+):([A-Z]+)$/i.exec(p.ref);
          if (k) sh.titleCols = [colIndex(k[1]), colIndex(k[2])];
        }
      }
    }
    // drawings: pictures and charts anchored to cells
    const sheetRels = pkg.rels(rel.target);
    for (const d of kids(root, 'drawing')) {
      const dr = sheetRels.get(attr(d, 'r:id'));
      const ddoc = dr && pkg.xml(dr.target);
      if (!ddoc) continue;
      const dRels = pkg.rels(dr.target);
      for (const anchor of kids(ddoc.documentElement)) {
        const kind = anchor.localName;
        if (!/Anchor$/.test(kind)) continue;
        // anchor cells are file-supplied: keep them on the grid (a row of 1e9 would size the row arrays)
        const pt = (e) => e && { c: clampInt(num(kid(e, 'col')?.textContent), 0, MAX_COL), cOff: num(kid(e, 'colOff')?.textContent) / 12700, r: clampInt(num(kid(e, 'row')?.textContent), 0, MAX_ROW), rOff: num(kid(e, 'rowOff')?.textContent) / 12700 };
        const item = { from: pt(kid(anchor, 'from')), to: pt(kid(anchor, 'to')) };
        const ext = kid(anchor, 'ext');
        if (ext) item.ext = { w: num(attr(ext, 'cx')) / 12700, h: num(attr(ext, 'cy')) / 12700 };
        const pos = kid(anchor, 'pos');
        if (pos) item.abs = { x: num(attr(pos, 'x')) / 12700, y: num(attr(pos, 'y')) / 12700 };
        const blip = descendants(anchor, 'blip')[0];
        const chartRef = descendants(anchor, 'chart')[0];
        if (blip && attr(blip, 'r:embed')) {
          const ir = dRels.get(attr(blip, 'r:embed'));
          const data = ir && pkg.bin(ir.target);
          if (data) sh.drawings.push({ ...item, kind: 'image', data, format: ir.target.split('.').pop().toLowerCase() });
        } else if (chartRef && attr(chartRef, 'r:id')) {
          const cr = dRels.get(attr(chartRef, 'r:id'));
          const cdoc = cr && pkg.xml(cr.target);
          if (cdoc) sh.drawings.push({ ...item, kind: 'chart', chart: parseChart(cdoc, theme, null, pkg.limits) });
        }
        if (item.to) { sh.maxR = Math.max(sh.maxR, item.to.r); sh.maxC = Math.max(sh.maxC, item.to.c); }
      }
    }
    return sh;
  });
  const defFont = styles.fonts[styles.xfs[0]?.fontId || 0] || { name: 'Calibri', size: 11 };
  return { sheets, styles, theme, date1904, defFont, limits: pkg.limits };
}

function styledBox(styles, s) {
  const xf = styles.xfs[s];
  if (!xf) return false;
  const b = styles.borders[xf.borderId];
  return !!(styles.fills[xf.fillId] || (b && (b.left || b.right || b.top || b.bottom)));
}

function dateToSerial(iso, date1904) {
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00Z' : iso);
  const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
  return (d.getTime() - base) / 86400000;
}

// ---------------------------------------------------------------- values --
const BUILTIN = { 14: 'm/d/yyyy', 22: 'm/d/yyyy h:mm' };
const COLORS = { red: '#FF0000', blue: '#0000FF', green: '#00FF00', yellow: '#FFFF00', magenta: '#FF00FF', cyan: '#00FFFF', black: '#000000', white: '#FFFFFF' };

function sectionFor(code, v) {
  const secs = [];
  let cur = '';
  let q = false;
  let br = false;
  for (const ch of code) {
    if (ch === '"') q = !q;
    if (!q && ch === '[') br = true;
    if (!q && ch === ']') br = false;
    if (ch === ';' && !q && !br) { secs.push(cur); cur = ''; } else cur += ch;
  }
  secs.push(cur);
  if (typeof v !== 'number') return secs[3] ?? null;
  if (v < 0 && secs.length > 1) return secs[1];
  if (v === 0 && secs.length > 2) return secs[2];
  return secs[0];
}

/** -> { text, color, isNum } */
export function formatCell(cell, model) {
  const xf = model.styles.xfs[cell.s] || model.styles.xfs[0];
  const v = cell.v;
  if (v == null) return { text: '', isNum: false };
  if (cell.t === 'b' || typeof v === 'boolean') return { text: v ? 'TRUE' : 'FALSE', isNum: false, isBool: true };
  if (cell.t === 'e') return { text: String(v), isNum: false, isBool: true };
  if (typeof v !== 'number') return { text: String(v), isNum: false };
  const id = xf.numFmtId || 0;
  const code = model.styles.numFmts.get(id) || BUILTIN[id] || id;
  let text;
  try {
    text = SSF.format(code, v, { date1904: model.date1904 });
  } catch {
    text = String(Math.round(v * 1e10) / 1e10);
  }
  let color = null;
  if (typeof code === 'string') {
    const sec = sectionFor(code, v);
    const m = sec && /\[(red|blue|green|yellow|magenta|cyan|black|white)\]/i.exec(sec);
    if (m) color = COLORS[m[1].toLowerCase()];
  }
  return { text, color, isNum: true };
}
