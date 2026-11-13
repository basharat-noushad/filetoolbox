// Word 97-2003 (.doc) reader: FIB, piece table, style sheet, font table, character and paragraph
// formatting (CHPX/PAPX FKPs), tables (cell/row marks and TDefTable widths and borders), page setup.
// Produces a simple document model (paragraphs and tables with runs) that doc/index.js writes as .docx.
// List numbering is regenerated from the list definitions. Not read: pictures, text boxes, headers/footers, footnotes.
import CFB from 'cfb';
import { DEFAULT_LIMITS, LimitError, DamagedError, clampInt } from '../common/limits.js';
import { checkOle } from '../common/ole.js';

const u16 = (b, p) => b[p] | (b[p + 1] << 8);
const i16 = (b, p) => (u16(b, p) << 16) >> 16;
const u32 = (b, p) => (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0;
// Word's 16-colour index (ico)
const ICO = [null, '#000000', '#0000FF', '#00FFFF', '#00FF00', '#FF00FF', '#FF0000', '#FFFF00', '#FFFFFF', '#000080', '#008080', '#008000', '#800080', '#800000', '#808000', '#808080', '#C0C0C0'];
const CP1252 = { 0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x2c6, 0x89: 0x2030, 0x8a: 0x160, 0x8b: 0x2039, 0x8c: 0x152, 0x8e: 0x17d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x2dc, 0x99: 0x2122, 0x9a: 0x161, 0x9b: 0x203a, 0x9c: 0x153, 0x9e: 0x17e, 0x9f: 0x178 };

/** operand length of a sprm (spra bits) at grpprl[p]; returns total bytes including the 2-byte sprm */
function sprmLen(g, p) {
  const sprm = u16(g, p);
  switch (sprm >> 13) {
    case 0: case 1: return 3;
    case 2: case 4: case 5: return 4;
    case 3: return 6;
    case 7: return 5;
    default:
      if (sprm === 0xd608 || sprm === 0xd606) return 3 + u16(g, p + 2); // TDefTable: 2-byte cb (= remainder + 1)
      if (sprm === 0xc615 && g[p + 2] === 255) {
        // PChgTabs with cb 255: the length follows from its counts (deletions carry a close-tolerance each)
        const del = g[p + 3] || 0;
        const add = g[p + 4 + del * 4] || 0;
        return 2 + 1 + 1 + del * 4 + 1 + add * 3;
      }
      return 3 + g[p + 2];
  }
}
function* sprms(g, p = 0, end = g.length) {
  while (p + 2 <= end) {
    const len = sprmLen(g, p);
    if (len < 3 || p + len > end + 1) return;
    yield { sprm: u16(g, p), p: p + 2, len };
    p += len;
  }
}

/** apply character sprms to a CHP-like object */
function applyChp(chp, g, start = 0, end = g.length, base = {}) {
  for (const { sprm, p } of sprms(g, start, end)) {
    const toggle = (k) => { const v = g[p]; chp[k] = v === 0x80 ? !!base[k] : v === 0x81 ? !base[k] : !!v; };
    switch (sprm) {
      case 0x0835: toggle('bold'); break;
      case 0x0836: toggle('italic'); break;
      case 0x0837: toggle('strike'); break;
      case 0x083a: toggle('smallCaps'); break;
      case 0x083b: toggle('caps'); break;
      case 0x083c: toggle('vanish'); break;
      case 0x0800: chp.deleted = !!g[p]; break; // tracked deletion: not part of the final text
      case 0x2a3e: chp.underline = g[p] !== 0; break;
      case 0x4a43: chp.size = u16(g, p) / 2; break;
      case 0x4a4f: chp.ftc = u16(g, p); break;
      case 0x4a50: if (chp.ftc == null) chp.ftc = u16(g, p); break;
      case 0x2a42: chp.color = ICO[g[p]] || null; break;
      case 0x6870: chp.color = g[p + 3] & 0xff ? null : '#' + [g[p], g[p + 1], g[p + 2]].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase(); break;
      case 0x2a48: chp.vert = g[p] === 1 ? 'super' : g[p] === 2 ? 'sub' : null; break;
      case 0x2a0c: chp.highlight = ICO[g[p]] || null; break;
      case 0x0855: chp.special = !!g[p]; break;
      default: break;
    }
  }
  return chp;
}

/** apply paragraph sprms to a PAP-like object */
function applyPap(pap, g, start = 0, end = g.length) {
  for (const { sprm, p, len } of sprms(g, start, end)) {
    switch (sprm) {
      case 0x2403: case 0x2461: pap.jc = g[p]; break;
      case 0x840f: case 0x845e: pap.left = i16(g, p); break;
      case 0x840e: case 0x845d: pap.right = i16(g, p); break;
      case 0x8411: case 0x8460: pap.first = i16(g, p); break;
      case 0xa413: pap.before = u16(g, p); break;
      case 0xa414: pap.after = u16(g, p); break;
      case 0x6412: pap.line = { dya: i16(g, p), mult: u16(g, p + 2) }; break;
      case 0x2416: pap.inTable = !!g[p]; break;
      case 0x2417: pap.ttp = !!g[p]; break;
      case 0x6649: pap.depth = u32(g, p); break;
      case 0x244b: pap.inner = !!g[p]; break; // sprmPFInnerTableCell
      case 0x244c: pap.innerTtp = !!g[p]; break; // sprmPFInnerTtp
      case 0x2407: pap.pageBreak = !!g[p]; break;
      case 0x260a: pap.ilvl = g[p]; break;
      case 0x460b: pap.ilfo = u16(g, p); break;
      case 0x4600: pap.istd = u16(g, p); break;
      case 0x246d: pap.contextual = !!g[p]; break; // no space between paragraphs of the same style
      case 0xd608: pap.tdef = g.subarray(p + 2, p - 2 + len); break; // sprmTDefTable operand (after its 2-byte cb)
      case 0x9602: pap.gapHalf = i16(g, p); break; // sprmTDxaGapHalf: half the space between cells' text
      case 0x9407: pap.rowH = i16(g, p); break; // sprmTDyaRowHeight: > 0 at least, < 0 exactly
      case 0xc60d: case 0xc615: {
        // sprmPChgTabsPapx / sprmPChgTabs: delete then add tab stops (positions in twips; tbd: jc bits 0-2, leader bits 3-5)
        const end = p - 2 + len;
        let q = p + 1;
        const nDel = g[q++] || 0;
        const del = [];
        for (let k = 0; k < nDel && q + 2 <= end; k++, q += 2) del.push(i16(g, q));
        if (sprm === 0xc615) q += nDel * 2; // rgdxaClose
        const nAdd = g[q++] || 0;
        const tabs = (pap.tabs || []).filter((t) => !del.some((d, k) => Math.abs(t.pos - d) <= (sprm === 0xc615 ? Math.max(1, i16(g, p + 2 + nDel * 2 + k * 2)) : 0)));
        for (let k = 0; k < nAdd && q + nAdd * 2 + k < end; k++) {
          const pos = i16(g, q + k * 2);
          const tbd = g[q + nAdd * 2 + k];
          const jc = tbd & 7;
          if (jc === 4) continue; // bar tab: a vertical line, not a stop
          const i = tabs.findIndex((t) => t.pos === pos);
          const t = { pos, jc: ['left', 'center', 'right', 'decimal', 'bar', 'left', 'left', 'left'][jc], leader: [null, 'dot', 'hyphen', 'underscore', 'heavy', 'middleDot', null, null][(tbd >> 3) & 7] };
          if (i >= 0) tabs[i] = t; else tabs.push(t);
        }
        pap.tabs = tabs.sort((a, b) => a.pos - b.pos);
        break;
      }
      case 0xd605: pap.tblBorders80 = g.subarray(p + 1, p + 1 + 24); break;
      case 0xd613: pap.tblBorders = g.subarray(p + 1, p + 1 + 48); break;
      default: break;
    }
  }
  return pap;
}

export function loadDoc(bytes, { limits = DEFAULT_LIMITS } = {}) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  checkOle(u8, limits); // shared-sector amplification (see common/ole.js)
  let cfb;
  try { cfb = CFB.read(u8, { type: 'array' }); } catch { throw new Error('Not a readable Word 97-2003 file'); }
  const stream = (n) => { const e = CFB.find(cfb, n); return e?.content ? (e.content instanceof Uint8Array ? e.content : new Uint8Array(e.content)) : null; };
  const W = stream('WordDocument');
  if (!W || u16(W, 0) !== 0xa5ec) throw new Error('Not a Word 97-2003 document (Word 6/95 files are not supported)');
  const flags = u16(W, 0x0a);
  if (flags & 0x0100) throw new Error('This .doc file is password-protected');
  let T = stream(flags & 0x0200 ? '1Table' : '0Table') || stream(flags & 0x0200 ? '0Table' : '1Table');
  if (!T) throw new Error('This .doc file is damaged (its table stream is missing)');
  const csw = u16(W, 0x20);
  const lwBase = 0x22 + csw * 2 + 2;
  const ccpText = u32(W, lwBase + 3 * 4);
  const cslw = u16(W, 0x22 + csw * 2);
  const fcBase = 0x22 + csw * 2 + 2 + cslw * 4 + 2;
  // FIB (offset, length) pair into the table stream, clamped to it: damaged files point anywhere
  const fcl = (i) => {
    const fc = u32(W, fcBase + i * 8);
    const lcb = u32(W, fcBase + i * 8 + 4);
    return fc < T.length && lcb ? [fc, Math.min(lcb, T.length - fc)] : [0, 0];
  };

  // ---------------------------------------------------------------- pieces -> text
  const [fcClx, lcbClx] = fcl(33);
  const findPcdt = (tbl) => {
    let q = fcClx;
    const stop = Math.min(tbl.length, fcClx + lcbClx);
    while (q < stop && tbl[q] === 1) q += 3 + u16(tbl, q + 1); // skip Prc (property modifiers)
    return q < stop && tbl[q] === 2 ? q : -1;
  };
  let p = findPcdt(T);
  if (p < 0) {
    // some files flag the wrong table stream; try the other one before giving up
    const other = stream(flags & 0x0200 ? '0Table' : '1Table');
    if (other && findPcdt(other) >= 0) { T = other; p = findPcdt(other); }
  }
  if (p < 0) throw new Error('This .doc file is damaged (its text index is missing)');
  const lcb = Math.min(u32(T, p + 1), T.length - p - 5);
  const plc = p + 5;
  const n = Math.max(0, Math.floor((lcb - 4) / 12));
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const cp0 = u32(T, plc + i * 4);
    const cp1 = u32(T, plc + (i + 1) * 4);
    const fcRaw = u32(T, plc + (n + 1) * 4 + i * 8 + 2);
    const compressed = !!(fcRaw & 0x40000000);
    pieces.push({ cp0, cp1, fc: compressed ? (fcRaw & 0x3fffffff) / 2 : fcRaw, compressed });
  }
  // every character takes at least one byte of the WordDocument stream: more text than that is a damaged index
  const maxChars = Math.min(ccpText, W.length);
  const chunks = [];
  let nText = 0;
  const cpFc = []; // per piece: map cp -> fc for formatting lookups (cp order, non-overlapping)
  for (const pc of pieces) {
    if (pc.cp0 >= ccpText || nText >= maxChars) break;
    if (pc.cp1 <= pc.cp0 || pc.cp0 < nText) continue; // empty, backwards or overlapping piece
    // characters past the end of the stream are not in the file
    const avail = Math.max(0, Math.floor((W.length - pc.fc) / (pc.compressed ? 1 : 2)));
    const nChars = Math.min(pc.cp1, ccpText) - pc.cp0;
    const take = Math.min(nChars, avail, maxChars - nText);
    let t = '';
    if (pc.compressed) {
      for (let i = 0; i < take; i++) { const b = W[pc.fc + i]; t += String.fromCharCode(CP1252[b] || b); }
    } else {
      for (let i = 0; i < take; i++) t += String.fromCharCode(u16(W, pc.fc + i * 2));
    }
    // pieces follow each other in cp order; a gap would shift every later character
    if (pc.cp0 > nText) { const gap = Math.min(pc.cp0 - nText, maxChars - nText); chunks.push(' '.repeat(gap)); nText += gap; }
    chunks.push(t);
    cpFc.push({ ...pc, cp0: nText, cp1: nText + take });
    nText += take;
    if (take < nChars) break;
  }
  const text = chunks.join('');
  const fcOf = (cp) => {
    let lo = 0;
    let hi = cpFc.length - 1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      const x = cpFc[m];
      if (cp < x.cp0) hi = m - 1; else if (cp >= x.cp1) lo = m + 1; else return x.fc + (cp - x.cp0) * (x.compressed ? 1 : 2);
    }
    return -1;
  };

  // ---------------------------------------------------------------- fonts
  const [fcFfn, lcbFfn] = fcl(15);
  const fonts = [];
  if (lcbFfn) {
    let q = fcFfn;
    let count = u16(T, q);
    q += 2;
    if (count === 0xffff) { count = u16(T, q); q += 2; }
    q += 2; // cbExtra
    for (let i = 0; i < count && q < fcFfn + lcbFfn; i++) {
      const cb = T[q] + 1;
      let name = '';
      for (let k = q + 40; k + 1 < q + cb; k += 2) { const c = u16(T, k); if (!c) break; name += String.fromCharCode(c); }
      fonts.push(name || 'Times New Roman');
      q += cb;
    }
  }

  // ---------------------------------------------------------------- styles
  const [fcStsh, lcbStsh] = fcl(1);
  const styles = [];
  if (lcbStsh) {
    const cbStshi = u16(T, fcStsh);
    const s0 = fcStsh + 2;
    const cstd = u16(T, s0);
    const cbBase = u16(T, s0 + 2);
    let q = s0 + cbStshi;
    for (let i = 0; i < cstd && q < fcStsh + lcbStsh; i++) {
      const cbStd = u16(T, q);
      q += 2;
      if (!cbStd) { styles.push(null); continue; }
      const st = q;
      const stk = u16(T, st + 2) & 0xf;
      const istdBase = u16(T, st + 2) >> 4;
      const cupx = u16(T, st + 4) & 0xf;
      let r = st + cbBase;
      const cch = Math.min(u16(T, r), 255); // style names are at most 255 characters
      let name = '';
      for (let k = 0; k < cch; k++) name += String.fromCharCode(u16(T, r + 2 + k * 2));
      r += 2 + cch * 2 + 2;
      const upx = [];
      for (let k = 0; k < cupx && r < st + cbStd; k++) {
        if ((r - st) & 1) r++;
        const cb = u16(T, r);
        upx.push(T.subarray(r + 2, r + 2 + cb));
        r += 2 + cb;
      }
      styles.push({ name, kind: stk, base: istdBase === 0xfff ? null : istdBase, upx });
      q = st + cbStd;
    }
  }
  const resolved = new Map();
  const styleProps = (istd, depth = 0) => {
    if (resolved.has(istd)) return resolved.get(istd);
    const s = styles[istd];
    const out = { chp: { size: 10, ftc: 0 }, pap: { jc: 0, left: 0, right: 0, first: 0, before: 0, after: 0 }, name: s?.name || '' };
    if (!s || depth > 10) return out;
    if (s.base != null && s.base !== istd) {
      const b = styleProps(s.base, depth + 1);
      Object.assign(out.chp, b.chp);
      Object.assign(out.pap, b.pap);
    }
    if (s.kind === 1 && s.upx[0]) applyPap(out.pap, s.upx[0], 2); // paragraph style: PAPX (after its istd), then CHPX
    const chpx = s.kind === 1 ? s.upx[1] : s.kind === 2 ? s.upx[0] : null;
    if (chpx) applyChp(out.chp, chpx, 0, chpx.length, { ...out.chp });
    resolved.set(istd, out);
    return out;
  };

  // ---------------------------------------------------------------- formatting runs (by file offset)
  const fkpRuns = (fcPlc, lcbPlc, isPap) => {
    const runs = [];
    if (!lcbPlc) return runs;
    const nb = (lcbPlc - 4) / 8;
    for (let i = 0; i < nb; i++) {
      const pn = u32(T, fcPlc + (nb + 1) * 4 + i * 4) & 0x3fffff;
      const page = W.subarray(pn * 512, pn * 512 + 512);
      if (page.length < 512) continue;
      const crun = page[511];
      for (let k = 0; k < crun; k++) {
        const fc0 = u32(page, k * 4);
        const fc1 = u32(page, (k + 1) * 4);
        if (isPap) {
          const off = page[(crun + 1) * 4 + k * 13] * 2;
          if (!off) { runs.push({ fc0, fc1, istd: 0, g: new Uint8Array(0) }); continue; }
          let cb = page[off];
          let start = off + 1;
          if (cb === 0) { cb = page[off + 1]; start = off + 2; cb *= 2; } else cb = cb * 2 - 1;
          runs.push({ fc0, fc1, istd: u16(page, start), g: page.subarray(start + 2, start + cb) });
        } else {
          const off = page[(crun + 1) * 4 + k] * 2;
          runs.push({ fc0, fc1, g: off ? page.subarray(off + 1, off + 1 + page[off]) : new Uint8Array(0) });
        }
      }
    }
    return runs.sort((a, b) => a.fc0 - b.fc0);
  };
  const [fcChpx, lcbChpx] = fcl(12);
  const [fcPapx, lcbPapx] = fcl(13);
  const chpRuns = fkpRuns(fcChpx, lcbChpx, false);
  const papRuns = fkpRuns(fcPapx, lcbPapx, true);
  const find = (list, fc) => {
    let lo = 0;
    let hi = list.length - 1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (fc < list[m].fc0) hi = m - 1; else if (fc >= list[m].fc1) lo = m + 1; else return list[m];
    }
    return null;
  };

  // ---------------------------------------------------------------- lists (LST/LVL + LFO)
  const lists = new Map(); // lsid -> [levels: { start, nfc, text, pap }]
  const [fcLst, lcbLst] = fcl(73);
  if (lcbLst > 2) {
    const cLst = Math.min(u16(T, fcLst), Math.floor((lcbLst - 2) / 28));
    let q = fcLst + 2 + cLst * 28;
    // the LVLs follow the LSTF array; all of it stays inside the PlfLst (Word puts them right after it)
    const lvlEnd = T.length;
    for (let i = 0; i < cLst; i++) {
      const lstf = fcLst + 2 + i * 28;
      const lsid = u32(T, lstf);
      const simple = T[lstf + 26] & 1;
      const levels = [];
      for (let l = 0; l < (simple ? 1 : 9) && q + 28 <= lvlEnd; l++) {
        const start = u32(T, q);
        const nfc = T[q + 4];
        const cbChpx = T[q + 24];
        const cbPapx = T[q + 25];
        const pap = applyPap({}, T.subarray(q + 28, q + 28 + cbPapx));
        let r = q + 28 + cbPapx + cbChpx;
        const cch = Math.min(u16(T, r), Math.max(0, (lvlEnd - r - 2) >> 1));
        let xst = '';
        for (let k = 0; k < cch; k++) xst += String.fromCharCode(u16(T, r + 2 + k * 2));
        r += 2 + cch * 2;
        levels.push({ start, nfc, text: xst, pap });
        q = r;
      }
      lists.set(lsid, levels);
    }
  }
  const lfos = [];
  const [fcLfo, lcbLfo] = fcl(74);
  if (lcbLfo > 4) {
    const n = u32(T, fcLfo);
    for (let i = 0; i < n && fcLfo + 4 + (i + 1) * 16 <= fcLfo + lcbLfo; i++) lfos.push(u32(T, fcLfo + 4 + i * 16));
  }
  const counters = new Map(); // lsid -> numbers per level
  const listMarker = (ilfo, ilvl) => {
    const lsid = lfos[ilfo - 1];
    const levels = lists.get(lsid);
    const lvl = levels?.[Math.min(ilvl, levels.length - 1)];
    if (!lvl) return null;
    if (lvl.nfc === 23 || lvl.nfc === 255) {
      const c = lvl.text.charCodeAt(0);
      const mapped = c >= 0xf000 ? ({ 0xb7: '•', 0xa7: '▪', 0xd8: '➢', 0xfc: '✓', 0x6f: 'o', 0x76: '❖', 0x71: '❑', 0x6e: '■' }[c & 0xff] || '•') : lvl.text || '•';
      return { text: lvl.nfc === 255 ? '' : mapped, pap: lvl.pap };
    }
    const nums = counters.get(lsid) || [];
    nums[ilvl] = nums[ilvl] == null ? lvl.start : nums[ilvl] + 1;
    for (let k = ilvl + 1; k < 9; k++) nums[k] = undefined;
    counters.set(lsid, nums);
    const fmt = (n, nfc) => {
      if (nfc === 1 || nfc === 2) { let x = n; let s = ''; for (const [v, r] of [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]) while (x >= v) { s += r; x -= v; } return nfc === 1 ? s.toUpperCase() : s; }
      if (nfc === 3 || nfc === 4) { let x = n; let s = ''; while (x > 0) { x--; s = String.fromCharCode(97 + (x % 26)) + s; x = Math.floor(x / 26); } return nfc === 3 ? s.toUpperCase() : s; }
      if (nfc === 22) return String(n).padStart(2, '0');
      return String(n);
    };
    let text = '';
    for (const ch of lvl.text) {
      const code = ch.charCodeAt(0);
      if (code < 9) { const lv = levels[code] || lvl; text += fmt(nums[code] ?? lv.start, lv.nfc); } else text += ch;
    }
    return { text, pap: lvl.pap };
  };

  // ---------------------------------------------------------------- sections (PlcfSed: n+1 CPs, then n 12-byte SEDs)
  const sections = [];
  const [fcSed, lcbSed] = fcl(6);
  const nSed = lcbSed >= 16 ? Math.floor((lcbSed - 4) / 16) : 0;
  for (let i = 0; i < nSed; i++) {
    // Word's defaults where the SEPX says nothing (letter, 1.25" side and 1" top/bottom margins)
    const page = { w: 12240, h: 15840, left: 1800, right: 1800, top: 1440, bottom: 1440, landscape: false, brk: 2, cpEnd: u32(T, fcSed + (i + 1) * 4) };
    const fcSepx = u32(T, fcSed + (nSed + 1) * 4 + i * 12 + 2);
    if (fcSepx !== 0xffffffff && fcSepx + 2 < W.length) {
      const cb = u16(W, fcSepx);
      for (const { sprm, p: q } of sprms(W, fcSepx + 2, Math.min(W.length, fcSepx + 2 + cb))) {
        if (sprm === 0xb01f) page.w = u16(W, q);
        else if (sprm === 0xb020) page.h = u16(W, q);
        else if (sprm === 0xb021) page.left = u16(W, q);
        else if (sprm === 0xb022) page.right = u16(W, q);
        else if (sprm === 0x9023) page.top = Math.abs(i16(W, q));
        else if (sprm === 0x9024) page.bottom = Math.abs(i16(W, q));
        else if (sprm === 0x301d) page.landscape = W[q] === 2; // sprmSBOrientation: 1 portrait, 2 landscape
        else if (sprm === 0x3009) page.brk = W[q]; // sprmSBkc: how the section starts (0 continuous, 2 new page)
      }
    }
    // nonsense sizes (damaged SEPX) fall back to letter
    if (!(page.w >= 1440 && page.w <= 31680 && page.h >= 1440 && page.h <= 31680)) { page.w = 12240; page.h = 15840; }
    if (page.left + page.right > page.w - 720) page.left = page.right = 1800;
    if (page.top + page.bottom > page.h - 720) page.top = page.bottom = 1440;
    sections.push(page);
  }
  if (!sections.length) sections.push({ w: 12240, h: 15840, left: 1800, right: 1800, top: 1440, bottom: 1440, landscape: false, brk: 2, cpEnd: Infinity });
  sections[sections.length - 1].cpEnd = Infinity;
  const page = sections[0];
  let sec = 0;
  // a section mark (0x0C at a section's last cp) also ends a paragraph; other 0x0C are page breaks
  const secMarks = new Set(sections.slice(0, -1).map((s) => s.cpEnd - 1));

  // ---------------------------------------------------------------- paragraphs, runs, tables
  const blocks = [];
  let row = null; // cells of the current table row
  let cell = [];
  let table = null;
  let cp = 0;
  let field = [];
  while (cp < text.length) {
    let e = cp;
    while (e < text.length && text[e] !== '\r' && text[e] !== '\x07' && !(text[e] === '\x0c' && secMarks.has(e))) e++;
    const mark = text[e];
    const papR = find(papRuns, fcOf(Math.min(e, text.length - 1)));
    const sty = styleProps(papR?.istd ?? 0);
    const pap0 = applyPap({ ...sty.pap, istd: papR?.istd ?? 0 }, papR?.g || new Uint8Array(0));
    // list paragraphs take the level's indents unless the paragraph sets its own
    const marker = pap0.ilfo > 0 && pap0.ilfo < 2000 ? listMarker(pap0.ilfo, pap0.ilvl || 0) : null;
    const pap = marker ? applyPap({ ...sty.pap, ...marker.pap }, papR?.g || new Uint8Array(0)) : pap0;
    const runs = [];
    let cur = null;
    for (let i = cp; i < e; i++) {
      const ch = text[i];
      // fields: hide the instruction (between 0x13 and 0x14), keep the result
      if (ch === '\x13') { if (field.length < 64) field.push('code'); continue; } // deeper nesting is damage
      if (ch === '\x14') { if (field.length) field[field.length - 1] = 'result'; continue; }
      if (ch === '\x15') { field.pop(); continue; }
      if (field.includes('code')) continue;
      const chR = find(chpRuns, fcOf(i));
      const chp = applyChp({ ...sty.chp }, chR?.g || new Uint8Array(0), 0, chR?.g?.length || 0, sty.chp);
      if (chp.vanish || chp.deleted) continue;
      let c = ch;
      if (c === '\x0b') c = '\n';
      else if (c === '\x0c') { if (runs.length || cur) { c = '\n'; } else { pap.pageBreak = true; continue; } } else if (c === '\x1e') c = '‑';
      else if (c === '\x1f') continue;
      else if (c < ' ' && c !== '\t' && c !== '\n') continue; // pictures, footnote marks, drawn objects
      const style = { bold: !!chp.bold, italic: !!chp.italic, underline: !!chp.underline, strike: !!chp.strike, size: chp.size || 10, font: fonts[chp.ftc] || 'Times New Roman', color: chp.color || null, highlight: chp.highlight || null, vert: chp.vert || null, caps: !!chp.caps };
      const key = JSON.stringify(style);
      if (cur && cur.key === key) cur.text += c;
      else { cur = { key, text: c, ...style }; runs.push(cur); }
    }
    for (const r of runs) delete r.key;
    const istd = papR?.istd ?? 0;
    while (sec < sections.length - 1 && e >= sections[sec].cpEnd) sec++; // the section mark ends the section's last paragraph
    const para = {
      sec,
      istd, contextual: !!pap.contextual,
      runs, align: ['left', 'center', 'right', 'both'][pap.jc] || 'left', left: pap.left || 0, right: pap.right || 0, first: pap.first || 0, tabs: pap.tabs || [],
      before: pap.before || 0, after: pap.after || 0, line: pap.line || null, pageBreak: !!pap.pageBreak, marker: marker?.text || null, level: pap.ilvl || 0,
      heading: /^heading \d/i.test(sty.name) ? Number(sty.name.replace(/\D/g, '')) : 0,
    };
    if (pap.inTable && !(pap.depth > 1)) {
      if (!table) { table = { type: 'table', rows: [], sec }; blocks.push(table); }
      if (pap.ttp) {
        // row end mark: carries the row's column layout
        const widths = [];
        const bounds = []; // rgdxaCenter: cell edges relative to the left margin
        let borders = true;
        let cellBorders = null;
        if (pap.tdef?.length) {
          const itc = Math.min(pap.tdef[0], 63, (pap.tdef.length - 3) >> 1);
          for (let k = 0; k <= itc; k++) bounds.push(i16(pap.tdef, 1 + k * 2));
          for (let k = 0; k < itc; k++) widths.push(bounds[k + 1] - bounds[k]);
          // TC80 cells follow: 20 bytes each with four BRC80 borders; all-zero means no borders
          const tc0 = 1 + (itc + 1) * 2;
          if (pap.tdef.length >= tc0 + 20 * itc) {
            let any = false;
            for (let k = 0; k < itc; k++) for (let b = 4; b < 20; b++) if (pap.tdef[tc0 + k * 20 + b]) any = true;
            if (!any && !pap.tblBorders80 && !pap.tblBorders) borders = false;
            // per-cell borders (BRC80 top, left, bottom, right): Word draws only the sides that are set
            if (any) {
              const brc = (o) => {
                const t = pap.tdef[o + 1];
                if (u32(pap.tdef, o) === 0xffffffff || !t) return null;
                return { w: Math.max(2, pap.tdef[o]), type: t, color: ICO[pap.tdef[o + 2]] || '#000000' }; // width in eighths of a point
              };
              cellBorders = [];
              for (let k = 0; k < itc; k++) { const o = tc0 + k * 20 + 4; cellBorders.push({ top: brc(o), left: brc(o + 4), bottom: brc(o + 8), right: brc(o + 12) }); }
            }
          }
        }
        if (row) table.rows.push({ cells: row, widths, bounds, borders, cellBorders, gapHalf: pap.gapHalf ?? 108, height: pap.rowH || 0 });
        row = null;
      } else if (mark === '\x07') {
        cell.push(para);
        (row || (row = [])).push(cell);
        cell = [];
      } else cell.push(para);
    } else {
      if (table) { if (cell.length || row) { if (cell.length) (row || (row = [])).push(cell); table.rows.push({ cells: row || [], widths: [], borders: true }); } table = null; row = null; cell = []; }
      if (pap.inTable && pap.depth > 1) para.nested = true;
      const prev = blocks[blocks.length - 1];
      if (prev?.type === 'para' && prev.istd === para.istd) {
        if (para.contextual) para.before = 0;
        if (prev.contextual) prev.after = 0;
      }
      blocks.push({ type: 'para', ...para });
    }
    cp = e + 1;
  }
  return { blocks, page, sections };
}
