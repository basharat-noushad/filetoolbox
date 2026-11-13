// Excel 97-2003 (.xls, BIFF8) reader. Produces the same workbook model as xlsx2pdf/model.js (loadXlsx), so
// the Excel print layout renders old files unchanged: values (shared strings, RK/MULRK, numbers, cached
// formula results), fonts, fills, borders, number formats, alignment, column widths, row heights, merges,
// hidden rows/columns/sheets, page setup, margins, page breaks, headers/footers and print areas/titles.
// Excel 5/95 (BIFF5) files are read for values with default formatting. Charts and pictures are not read.
import CFB from 'cfb';
import { DEFAULT_LIMITS, LimitError, DamagedError, clampInt } from '../common/limits.js';
import { checkOle } from '../common/ole.js';
import { KEY } from '../xlsx2pdf/model.js';
import { INDEXED } from '../common/color.js';

const T = {
  BOF: 0x0809, EOF: 0x000a, BOUNDSHEET: 0x0085, SST: 0x00fc, CONTINUE: 0x003c, FONT: 0x0031, FORMAT: 0x041e, XF: 0x00e0, PALETTE: 0x0092,
  DATEMODE: 0x0022, FILEPASS: 0x002f, NAME: 0x0018, CODEPAGE: 0x0042,
  LABELSST: 0x00fd, LABEL: 0x0204, RSTRING: 0x00d6, RK: 0x027e, MULRK: 0x00bd, NUMBER: 0x0203, BOOLERR: 0x0205, FORMULA: 0x0006, STRING: 0x0207,
  BLANK: 0x0201, MULBLANK: 0x00be, ROW: 0x0208, COLINFO: 0x007d, DEFCOLWIDTH: 0x0055, STANDARDWIDTH: 0x0099, DEFAULTROWHEIGHT: 0x0225,
  MERGECELLS: 0x00e5, HPAGEBREAKS: 0x001b, VPAGEBREAKS: 0x001a, HEADER: 0x0014, FOOTER: 0x0015, LEFTMARGIN: 0x0026, RIGHTMARGIN: 0x0027,
  TOPMARGIN: 0x0028, BOTTOMMARGIN: 0x0029, SETUP: 0x00a1, WSBOOL: 0x0081, PRINTGRIDLINES: 0x002b, HCENTER: 0x0083, VCENTER: 0x0084,
};
const BORDER = [null, 'thin', 'medium', 'dashed', 'dotted', 'thick', 'double', 'hair', 'mediumDashed', 'dashDot', 'mediumDashDot', 'dashDotDot', 'mediumDashDotDot', 'slantDashDot'];
const HALIGN = ['general', 'left', 'center', 'right', 'fill', 'justify', 'centerContinuous', 'distributed'];
const VALIGN = ['top', 'center', 'bottom', 'justify', 'distributed'];

function* records(buf, start = 0) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let p = start;
  while (p + 4 <= buf.length) {
    const type = dv.getUint16(p, true);
    const len = dv.getUint16(p + 2, true);
    if (p + 4 + len > buf.length) return;
    yield { type, data: buf.subarray(p + 4, p + 4 + len), pos: p };
    p += 4 + len;
  }
}

const latin1 = (b) => { let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s; };
const utf16 = (b) => { let s = ''; for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode(b[i] | (b[i + 1] << 8)); return s; };

/** BIFF8 unicode string at data[p]: lenBytes = 1 (short) or 2; returns [string, next offset] */
function xlString(data, p, lenBytes, biff5 = false) {
  const cch = lenBytes === 1 ? data[p] : data[p] | (data[p + 1] << 8);
  p += lenBytes;
  if (biff5) return [latin1(data.subarray(p, p + cch)), p + cch];
  const flags = data[p++];
  let runs = 0;
  let ext = 0;
  if (flags & 8) { runs = data[p] | (data[p + 1] << 8); p += 2; }
  if (flags & 4) { ext = new DataView(data.buffer, data.byteOffset + p, 4).getUint32(0, true); p += 4; }
  const n = flags & 1 ? cch * 2 : cch;
  const s = flags & 1 ? utf16(data.subarray(p, p + n)) : latin1(data.subarray(p, p + n));
  return [s, p + n + runs * 4 + ext];
}

/** the shared string table, which may continue over CONTINUE records (each restarting the char encoding) */
function readSST(parts) {
  const buf = new Uint8Array(parts.reduce((a, b) => a + b.length, 0));
  const bounds = [];
  let o = 0;
  for (const b of parts) { bounds.push(o); buf.set(b, o); o += b.length; }
  const dv = new DataView(buf.buffer);
  const unique = dv.getUint32(4, true);
  const out = [];
  let p = 8;
  let bi = 1;
  const nextBound = () => { while (bi < bounds.length && bounds[bi] <= p) bi++; return bi < bounds.length ? bounds[bi] : buf.length; };
  for (let i = 0; i < unique && p + 3 <= buf.length; i++) {
    if (bi < bounds.length && bounds[bi] === p) bi++;
    const cch = dv.getUint16(p, true);
    let flags = buf[p + 2];
    p += 3;
    let runs = 0;
    let ext = 0;
    if (flags & 8) { runs = dv.getUint16(p, true); p += 2; }
    if (flags & 4) { ext = dv.getUint32(p, true); p += 4; }
    let s = '';
    let left = cch;
    while (left > 0 && p < buf.length) {
      const end = nextBound();
      const wide = flags & 1;
      const avail = Math.floor((end - p) / (wide ? 2 : 1));
      const take = Math.min(left, avail);
      s += wide ? utf16(buf.subarray(p, p + take * 2)) : latin1(buf.subarray(p, p + take));
      p += take * (wide ? 2 : 1);
      left -= take;
      if (left > 0) { flags = buf[p]; p += 1; bi++; } // a new chunk starts with its own encoding flag
    }
    p += runs * 4 + ext;
    out.push(s);
  }
  return out;
}

function rk(v) {
  let n;
  if (v & 2) n = v >> 2;
  else {
    const b = new DataView(new ArrayBuffer(8));
    b.setUint32(4, v & 0xfffffffc, true);
    n = b.getFloat64(0, true);
  }
  return v & 1 ? n / 100 : n;
}

export function loadXls(bytes, { maxCells, limits = DEFAULT_LIMITS } = {}) {
  maxCells ??= limits.maxCells;
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  checkOle(u8, limits); // shared-sector amplification (see common/ole.js)
  let cfb;
  try { cfb = CFB.read(u8, { type: 'array' }); } catch { throw new Error('Not a readable Excel 97-2003 file'); }
  const entry = CFB.find(cfb, 'Workbook') || CFB.find(cfb, 'Book');
  if (!entry?.content) throw new Error('No workbook stream in this .xls file');
  const wb = entry.content instanceof Uint8Array ? entry.content : new Uint8Array(entry.content);
  const dvw = new DataView(wb.buffer, wb.byteOffset, wb.byteLength);
  const fonts = [];
  const formats = new Map();
  const rawXfs = [];
  const palette = INDEXED.slice();
  const sheetsMeta = [];
  const names = [];
  let sst = [];
  let date1904 = false;
  let biff5 = false;
  // ---------------------------------------------------------------- globals
  let sstParts = null;
  for (const rec of records(wb)) {
    const d = rec.data;
    const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
    if (sstParts && rec.type !== T.CONTINUE) { sst = readSST(sstParts); sstParts = null; }
    switch (rec.type) {
      case T.BOF: if (dv.getUint16(0, true) < 0x0600) biff5 = true; break;
      case T.FILEPASS: throw new Error('This .xls file is password-protected');
      case T.DATEMODE: date1904 = dv.getUint16(0, true) === 1; break;
      case T.SST: sstParts = [d]; break;
      case T.CONTINUE: if (sstParts) sstParts.push(d); break;
      case T.BOUNDSHEET: {
        const [name] = xlString(d, 6, 1, biff5);
        sheetsMeta.push({ pos: dv.getUint32(0, true), hidden: (d[4] & 3) !== 0, kind: d[5], name });
        break;
      }
      case T.FONT: {
        const [name] = xlString(d, 14, 1, biff5);
        fonts.push({
          name: name || 'Arial', size: dv.getUint16(0, true) / 20, italic: !!(d[2] & 2), strike: !!(d[2] & 8), colorIdx: dv.getUint16(4, true),
          bold: dv.getUint16(6, true) >= 700, vertAlign: { 1: 'superscript', 2: 'subscript' }[dv.getUint16(8, true)], underline: d[10] !== 0,
        });
        break;
      }
      case T.FORMAT: {
        const id = dv.getUint16(0, true);
        formats.set(id, biff5 ? latin1(d.subarray(3, 3 + d[2])) : xlString(d, 2, 2)[0]);
        break;
      }
      case T.XF: rawXfs.push(d.slice()); break;
      case T.PALETTE: {
        const n = dv.getUint16(0, true);
        for (let i = 0; i < n && 2 + i * 4 + 3 <= d.length; i++) palette[8 + i] = '#' + [d[2 + i * 4], d[3 + i * 4], d[4 + i * 4]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        break;
      }
      case T.NAME: if (!biff5) names.push(parseName(d)); break;
      default: break;
    }
    if (rec.type === T.EOF) break;
  }
  if (sstParts) sst = readSST(sstParts);
  const color = (i) => (i === 64 || i === 0x7fff ? null : i === 65 ? '#FFFFFF' : palette[i] || null);

  // ---------------------------------------------------------------- styles (xlsx-shaped)
  const styles = { numFmts: formats, fonts: [], fills: [], borders: [], xfs: [] };
  styles.fonts = fonts.map((f) => ({ name: f.name, size: f.size, bold: f.bold, italic: f.italic, strike: f.strike, underline: f.underline, color: color(f.colorIdx), vertAlign: f.vertAlign }));
  // font index 4 does not exist in BIFF: the fifth FONT record is font 5
  const fontIdx = (i) => (i >= 4 ? i - 1 : i);
  rawXfs.forEach((x, i) => {
    const dv = new DataView(x.buffer, x.byteOffset, x.byteLength);
    if (biff5 || x.length < 20) {
      styles.fills.push(null);
      styles.borders.push({ left: null, right: null, top: null, bottom: null });
      styles.xfs.push({ numFmtId: dv.getUint16(2, true), fontId: fontIdx(dv.getUint16(0, true)), fillId: i, borderId: i, h: HALIGN[x[6] & 7] || 'general', v: 'bottom', wrap: !!(x[6] & 8), indent: 0, rot: 0, shrink: false });
      return;
    }
    const b1 = dv.getUint32(10, true);
    const b2 = dv.getUint32(14, true);
    const fill = dv.getUint16(18, true);
    const side = (style, icv) => (BORDER[style] ? { style: BORDER[style], color: color(icv) || '#000000' } : null);
    const fls = (b2 >>> 26) & 0x3f;
    const fore = color(fill & 0x7f);
    const back = color((fill >> 7) & 0x7f);
    styles.fills.push(fls ? { color: (fls === 1 ? fore : fore || back) || '#C0C0C0', solid: true } : null);
    styles.borders.push({
      left: side(b1 & 15, (b1 >>> 16) & 0x7f), right: side((b1 >>> 4) & 15, (b1 >>> 23) & 0x7f),
      top: side((b1 >>> 8) & 15, b2 & 0x7f), bottom: side((b1 >>> 12) & 15, (b2 >>> 7) & 0x7f),
    });
    styles.xfs.push({
      numFmtId: dv.getUint16(2, true), fontId: fontIdx(dv.getUint16(0, true)), fillId: i, borderId: i,
      h: HALIGN[x[6] & 7] || 'general', v: VALIGN[(x[6] >> 4) & 7] || 'bottom', wrap: !!(x[6] & 8),
      indent: x[8] & 15, rot: x[7] === 255 ? 255 : x[7], shrink: !!(x[8] & 16),
    });
  });
  if (!styles.xfs.length) styles.xfs.push({ numFmtId: 0, fontId: 0, fillId: 0, borderId: 0, h: 'general', v: 'bottom', wrap: false, indent: 0, rot: 0 });
  if (!styles.fonts.length) styles.fonts.push({ name: 'Arial', size: 10 });

  // ---------------------------------------------------------------- sheets
  let cellCount = 0;
  const sheets = [];
  sheetsMeta.forEach((meta, si) => {
    if (meta.kind !== 0) return; // charts, macro sheets, VB modules
    const sh = {
      name: meta.name, hidden: meta.hidden, cells: new Map(), merges: [], colW: new Map(), colHidden: new Set(), rowH: new Map(), rowHidden: new Set(),
      rowCustom: new Set(), defaultColW: null, defaultRowH: 12.75, maxR: -1, maxC: -1, drawings: [], rowBreaks: new Set(), colBreaks: new Set(),
      page: { paper: 9, landscape: false, scale: 100, fit: false, fitW: 1, fitH: 1, order: 'downThenOver', margins: { l: 0.75, r: 0.75, t: 1, b: 1, h: 0.5, f: 0.5 }, hCenter: false, vCenter: false, grid: false, firstPage: null },
      header: '', footer: '', printArea: null, titleRows: null, titleCols: null,
    };
    const put = (r, c, v, t, s) => {
      if (v == null && !s) return;
      if (c > 255) return; // BIFF5/8 sheets have 256 columns; a larger index is damage (and would size the layout)
      if (++cellCount > maxCells) throw new Error(`workbook has more than ${maxCells} cells`);
      sh.cells.set(KEY(r, c), { r, c, v, t, s, f: false });
      if (v != null && v !== '') { sh.maxR = Math.max(sh.maxR, r); sh.maxC = Math.max(sh.maxC, c); }
      else {
        const xf = styles.xfs[s];
        if (xf && (styles.fills[xf.fillId] || Object.values(styles.borders[xf.borderId] || {}).some(Boolean))) { sh.maxR = Math.max(sh.maxR, r); sh.maxC = Math.max(sh.maxC, c); }
      }
    };
    let pendingFormula = null;
    let noPls = false;
    for (const rec of records(wb, meta.pos)) {
      const d = rec.data;
      const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
      const r = d.length >= 2 ? dv.getUint16(0, true) : 0;
      const c = d.length >= 4 ? dv.getUint16(2, true) : 0;
      const s = d.length >= 6 ? dv.getUint16(4, true) : 0;
      if (rec.type === T.EOF) break;
      if (rec.type === T.BOF && rec.pos !== meta.pos) break;
      switch (rec.type) {
        case T.LABELSST: put(r, c, sst[dv.getUint32(6, true)] ?? '', 's', s); break;
        case T.LABEL: case T.RSTRING: put(r, c, xlString(d, 6, 2, biff5)[0], 's', s); break;
        case T.RK: put(r, c, rk(dv.getInt32(6, true)), 'n', s); break;
        case T.MULRK: {
          const n = (d.length - 6) / 6;
          for (let i = 0; i < n; i++) put(r, c + i, rk(dv.getInt32(4 + i * 6 + 2, true)), 'n', dv.getUint16(4 + i * 6, true));
          break;
        }
        case T.NUMBER: put(r, c, dv.getFloat64(6, true), 'n', s); break;
        case T.BOOLERR: put(r, c, d[7] ? ({ 0: '#NULL!', 7: '#DIV/0!', 15: '#VALUE!', 23: '#REF!', 29: '#NAME?', 36: '#NUM!', 42: '#N/A' }[d[6]] || '#ERR') : !!d[6], d[7] ? 'e' : 'b', s); break;
        case T.FORMULA: {
          if (d[12] === 0xff && d[13] === 0xff) {
            const kind = d[6];
            if (kind === 0) pendingFormula = { r, c, s }; // string result follows in a STRING record
            else if (kind === 1) put(r, c, !!d[8], 'b', s);
            else if (kind === 2) put(r, c, '#ERR', 'e', s);
            else put(r, c, '', 's', s);
          } else put(r, c, dv.getFloat64(6, true), 'n', s);
          break;
        }
        case T.STRING: if (pendingFormula) { put(pendingFormula.r, pendingFormula.c, xlString(d, 0, 2, biff5)[0], 's', pendingFormula.s); pendingFormula = null; } break;
        case T.BLANK: put(r, c, null, 'n', s); break;
        case T.MULBLANK: { const n = (d.length - 6) / 2; for (let i = 0; i < n; i++) put(r, c + i, null, 'n', dv.getUint16(4 + i * 2, true)); break; }
        case T.ROW: {
          const h = dv.getUint16(6, true);
          const flags = dv.getUint16(12, true);
          if (!(h & 0x8000)) sh.rowH.set(r, (h & 0x7fff) / 20);
          if (flags & 0x20) sh.rowHidden.add(r);
          if (flags & 0x40) sh.rowCustom.add(r);
          break;
        }
        case T.COLINFO: {
          const a = dv.getUint16(0, true);
          const b = Math.min(dv.getUint16(2, true), 255);
          const w = dv.getUint16(4, true) / 256;
          const hidden = dv.getUint16(8, true) & 1;
          for (let k = a; k <= b; k++) { sh.colW.set(k, w); if (hidden) sh.colHidden.add(k); }
          break;
        }
        case T.DEFCOLWIDTH: if (sh.defaultColW == null) sh.baseColW = dv.getUint16(0, true); break;
        case T.STANDARDWIDTH: sh.defaultColW = dv.getUint16(0, true) / 256; break;
        case T.DEFAULTROWHEIGHT: sh.defaultRowH = dv.getUint16(2, true) / 20 || 12.75; break;
        case T.MERGECELLS: {
          const n = dv.getUint16(0, true);
          for (let i = 0; i < n && 2 + i * 8 + 8 <= d.length; i++) {
            const o = 2 + i * 8;
            const ra = dv.getUint16(o, true);
            const rb = dv.getUint16(o + 2, true);
            const ca = dv.getUint16(o + 4, true);
            const cb = dv.getUint16(o + 6, true);
            // normalise and keep on the 65536 x 256 grid (damaged records have reversed or out-of-grid ends)
            const m = { r1: Math.min(ra, rb), r2: Math.max(ra, rb), c1: Math.min(ca, cb), c2: Math.min(255, Math.max(ca, cb)) };
            if (m.c1 > 255) continue;
            if (sh.merges.length >= limits.maxMerges) throw new LimitError(`a sheet has more than ${limits.maxMerges} merged ranges`);
            sh.merges.push(m);
            sh.maxR = Math.max(sh.maxR, m.r2);
            sh.maxC = Math.max(sh.maxC, m.c2);
          }
          break;
        }
        case T.HPAGEBREAKS: case T.VPAGEBREAKS: {
          const n = dv.getUint16(0, true);
          for (let i = 0; i < n; i++) (rec.type === T.HPAGEBREAKS ? sh.rowBreaks : sh.colBreaks).add(dv.getUint16(2 + i * 6, true) - 1);
          break;
        }
        case T.HEADER: if (d.length) sh.header = xlString(d, 0, biff5 ? 1 : 2, biff5)[0]; break;
        case T.FOOTER: if (d.length) sh.footer = xlString(d, 0, biff5 ? 1 : 2, biff5)[0]; break;
        case T.LEFTMARGIN: sh.page.margins.l = dv.getFloat64(0, true); break;
        case T.RIGHTMARGIN: sh.page.margins.r = dv.getFloat64(0, true); break;
        case T.TOPMARGIN: sh.page.margins.t = dv.getFloat64(0, true); break;
        case T.BOTTOMMARGIN: sh.page.margins.b = dv.getFloat64(0, true); break;
        case T.SETUP: {
          const flags = dv.getUint16(10, true);
          noPls = !!(flags & 4);
          if (!noPls) {
            sh.page.paper = dv.getUint16(0, true) || 9;
            sh.page.scale = dv.getUint16(2, true) || 100;
            sh.page.landscape = !(flags & 2);
          }
          sh.page.fitW = dv.getUint16(6, true);
          sh.page.fitH = dv.getUint16(8, true);
          if (flags & 1) sh.page.order = 'overThenDown';
          if (flags & 0x80) sh.page.firstPage = dv.getUint16(4, true);
          if (d.length >= 32) { sh.page.margins.h = dv.getFloat64(16, true); sh.page.margins.f = dv.getFloat64(24, true); }
          break;
        }
        case T.WSBOOL: sh.page.fit = !!(dv.getUint16(0, true) & 0x100); break;
        case T.PRINTGRIDLINES: sh.page.grid = dv.getUint16(0, true) === 1; break;
        case T.HCENTER: sh.page.hCenter = dv.getUint16(0, true) === 1; break;
        case T.VCENTER: sh.page.vCenter = dv.getUint16(0, true) === 1; break;
        default: break;
      }
    }
    // built-in names: print area and print titles of this sheet
    for (const n of names) {
      if (n.sheet !== si || !n.areas.length) continue;
      if (n.builtin === 6 && !sh.printArea) sh.printArea = n.areas[0];
      if (n.builtin === 7) {
        for (const a of n.areas) {
          if (a.c1 === 0 && a.c2 >= 255) sh.titleRows = [a.r1, a.r2];
          else if (a.r1 === 0 && a.r2 >= 65535) sh.titleCols = [a.c1, a.c2];
        }
      }
    }
    sheets.push(sh);
  });
  const defFont = styles.fonts[styles.xfs[0]?.fontId || 0] || { name: 'Arial', size: 10 };
  return { sheets, styles, theme: { major: 'Arial', minor: 'Arial' }, date1904, defFont, limits };
}

/** NAME record: only what print areas/titles need (built-in id, sheet, and the 3-D areas in its formula) */
function parseName(d) {
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
  const flags = dv.getUint16(0, true);
  const cch = d[3];
  const cce = dv.getUint16(4, true);
  const itab = dv.getUint16(8, true);
  let p = 14;
  const wide = d[p++] & 1;
  const builtin = flags & 0x20 ? d[p] : null;
  p += cch * (wide ? 2 : 1);
  const areas = [];
  const end = Math.min(d.length, p + cce);
  while (p < end) {
    const ptg = d[p++];
    const base = ptg & 0x1f | (ptg & 0x60 ? 0x20 : 0);
    if (ptg === 0x3b || ptg === 0x5b || ptg === 0x7b) { // ptgArea3d
      if (p + 10 > end) break;
      areas.push({ r1: dv.getUint16(p + 2, true), r2: dv.getUint16(p + 4, true), c1: dv.getUint16(p + 6, true) & 0xff, c2: dv.getUint16(p + 8, true) & 0xff });
      p += 10;
    } else if (ptg === 0x3a || ptg === 0x5a || ptg === 0x7a) { // ptgRef3d
      if (p + 6 > end) break;
      const r = dv.getUint16(p + 2, true);
      const c = dv.getUint16(p + 4, true) & 0xff;
      areas.push({ r1: r, r2: r, c1: c, c2: c });
      p += 6;
    } else if (ptg === 0x29 || ptg === 0x49 || ptg === 0x69) p += 2; // ptgMemFunc: the areas follow inline
    else if (ptg === 0x10 || ptg === 0x0f || ptg === 0x15) { /* union, isect, paren */ } else if (base === 0x3c || base === 0x3d) p += base === 0x3c ? 6 : 10; // ref/area errors
    else break;
  }
  return { builtin, sheet: itab ? itab - 1 : null, areas };
}
