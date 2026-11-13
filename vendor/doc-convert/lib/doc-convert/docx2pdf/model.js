// DOCX (WordprocessingML, ECMA-376) -> in-memory document model with resolved formatting.
import { openPackage } from '../common/ooxml.js';
import { DamagedError, clampInt } from '../common/limits.js';
import { parseXml, kids, kid, attr, wv, onOff, num, descendants } from '../common/xml.js';

const twip = (v) => num(v) / 20; // twentieths of a point -> pt
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';

// ------------------------------------------------------------------ theme --
function parseTheme(doc) {
  const theme = { major: 'Calibri Light', minor: 'Calibri' };
  if (!doc) return theme;
  for (const key of ['major', 'minor']) {
    const f = descendants(doc.documentElement, key + 'Font')[0];
    const latin = kid(f, 'latin');
    if (latin && attr(latin, 'typeface')) theme[key] = attr(latin, 'typeface');
  }
  return theme;
}

// ----------------------------------------------------- property appliers --
export const DEFAULT_RP = {
  font: 'Times New Roman', size: 10, bold: false, italic: false, underline: false,
  strike: false, color: null, highlight: null, vertAlign: null, caps: false,
  smallCaps: false, charSpacing: 0, hidden: false,
};
export const DEFAULT_PP = {
  jc: 'left', before: 0, after: 0, line: 240, lineRule: 'auto', indLeft: 0, indRight: 0,
  firstLine: 0, keepNext: false, keepLines: false, pageBreakBefore: false, numId: null,
  ilvl: 0, contextual: false, borders: {}, shading: null, tabs: [], outline: null,
};

const HIGHLIGHT = {
  yellow: '#FFFF00', green: '#00FF00', cyan: '#00FFFF', magenta: '#FF00FF', blue: '#0000FF',
  red: '#FF0000', darkBlue: '#000080', darkCyan: '#008080', darkGreen: '#008000',
  darkMagenta: '#800080', darkRed: '#800000', darkYellow: '#808000', darkGray: '#808080',
  lightGray: '#C0C0C0', black: '#000000', white: '#FFFFFF',
};

function applyRPr(R, rPr, theme) {
  if (!rPr) return;
  const fonts = kid(rPr, 'rFonts');
  if (fonts) {
    const th = wv(fonts, 'asciiTheme') || wv(fonts, 'hAnsiTheme');
    const ex = wv(fonts, 'ascii') || wv(fonts, 'hAnsi');
    if (th) R.font = th.startsWith('major') ? theme.major : theme.minor;
    else if (ex) R.font = ex;
  }
  const t = (name, key) => {
    const v = onOff(kid(rPr, name));
    if (v !== undefined) R[key] = v;
  };
  t('b', 'bold'); t('i', 'italic'); t('strike', 'strike'); t('dstrike', 'strike');
  t('caps', 'caps'); t('smallCaps', 'smallCaps'); t('vanish', 'hidden');
  const u = kid(rPr, 'u');
  if (u) R.underline = (wv(u) || 'single') !== 'none';
  const c = kid(rPr, 'color');
  if (c) R.color = wv(c) && wv(c) !== 'auto' ? '#' + wv(c) : null;
  const sz = kid(rPr, 'sz');
  if (sz) R.size = num(wv(sz), 20) / 2;
  const hl = kid(rPr, 'highlight');
  if (hl) R.highlight = HIGHLIGHT[wv(hl)] || null;
  const shd = kid(rPr, 'shd');
  if (shd && wv(shd, 'fill') && wv(shd, 'fill') !== 'auto') R.highlight = '#' + wv(shd, 'fill');
  const va = kid(rPr, 'vertAlign');
  if (va) R.vertAlign = wv(va) === 'baseline' ? null : wv(va);
  const sp = kid(rPr, 'spacing');
  if (sp) R.charSpacing = twip(wv(sp));
}

function parseBorder(el) {
  if (!el) return undefined;
  const val = wv(el);
  if (!val || val === 'nil' || val === 'none') return null;
  return {
    width: Math.max(0.25, num(wv(el, 'sz'), 4) / 8),
    space: num(wv(el, 'space'), 0),
    color: wv(el, 'color') && wv(el, 'color') !== 'auto' ? '#' + wv(el, 'color') : '#000000',
    style: val,
  };
}

function applyPPr(P, pPr) {
  if (!pPr) return;
  const jc = kid(pPr, 'jc');
  if (jc) {
    const v = wv(jc);
    P.jc = { start: 'left', end: 'right', both: 'both', distribute: 'both', center: 'center', right: 'right', left: 'left' }[v] || 'left';
  }
  const sp = kid(pPr, 'spacing');
  if (sp) {
    if (wv(sp, 'before') != null) P.before = twip(wv(sp, 'before'));
    if (wv(sp, 'after') != null) P.after = twip(wv(sp, 'after'));
    if (wv(sp, 'line') != null) P.line = num(wv(sp, 'line'));
    if (wv(sp, 'lineRule') != null) P.lineRule = wv(sp, 'lineRule');
  }
  const ind = kid(pPr, 'ind');
  if (ind) {
    const l = wv(ind, 'left') ?? wv(ind, 'start');
    const r = wv(ind, 'right') ?? wv(ind, 'end');
    if (l != null) P.indLeft = twip(l);
    if (r != null) P.indRight = twip(r);
    if (wv(ind, 'hanging') != null) P.firstLine = -twip(wv(ind, 'hanging'));
    else if (wv(ind, 'firstLine') != null) P.firstLine = twip(wv(ind, 'firstLine'));
  }
  const t = (name, key) => {
    const v = onOff(kid(pPr, name));
    if (v !== undefined) P[key] = v;
  };
  t('keepNext', 'keepNext'); t('keepLines', 'keepLines'); t('pageBreakBefore', 'pageBreakBefore');
  t('contextualSpacing', 'contextual');
  const numPr = kid(pPr, 'numPr');
  if (numPr) {
    const id = wv(kid(numPr, 'numId'));
    if (id != null) P.numId = id;
    const lvl = wv(kid(numPr, 'ilvl'));
    if (lvl != null) P.ilvl = num(lvl);
  }
  const pBdr = kid(pPr, 'pBdr');
  if (pBdr) {
    P.borders = { ...P.borders };
    for (const side of ['top', 'bottom', 'left', 'right']) {
      const b = parseBorder(kid(pBdr, side));
      if (b !== undefined) P.borders[side] = b;
    }
  }
  const shd = kid(pPr, 'shd');
  if (shd) P.shading = wv(shd, 'fill') && wv(shd, 'fill') !== 'auto' ? '#' + wv(shd, 'fill') : null;
  const tabs = kid(pPr, 'tabs');
  if (tabs) {
    const list = P.tabs.slice();
    for (const tb of kids(tabs, 'tab')) {
      const pos = twip(wv(tb, 'pos'));
      const val = wv(tb);
      const i = list.findIndex((x) => Math.abs(x.pos - pos) < 0.5);
      if (i >= 0) list.splice(i, 1);
      if (val !== 'clear') list.push({ pos, val });
    }
    P.tabs = list.sort((a, b) => a.pos - b.pos);
  }
  const ol = kid(pPr, 'outlineLvl');
  if (ol) P.outline = num(wv(ol));
}

// ----------------------------------------------------------------- styles --
function parseStyles(doc) {
  const st = { byId: new Map(), defaults: { rPr: null, pPr: null }, defPara: null, defTable: null, defChar: null };
  if (!doc) return st;
  const root = doc.documentElement;
  const dd = kid(root, 'docDefaults');
  st.defaults.rPr = kid(kid(dd, 'rPrDefault'), 'rPr');
  st.defaults.pPr = kid(kid(dd, 'pPrDefault'), 'pPr');
  for (const s of kids(root, 'style')) {
    const id = wv(s, 'styleId');
    const type = wv(s, 'type');
    const rec = {
      id, type, basedOn: wv(kid(s, 'basedOn')), pPr: kid(s, 'pPr'), rPr: kid(s, 'rPr'), tblPr: kid(s, 'tblPr'),
      name: wv(kid(s, 'name')),
    };
    st.byId.set(id, rec);
    if (wv(s, 'default') === '1' || wv(s, 'default') === 'true') {
      if (type === 'paragraph') st.defPara = id;
      if (type === 'table') st.defTable = id;
      if (type === 'character') st.defChar = id;
    }
  }
  return st;
}

function chain(styles, id) {
  const out = [];
  const seen = new Set();
  let cur = id ? styles.byId.get(id) : null;
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.unshift(cur);
    cur = cur.basedOn ? styles.byId.get(cur.basedOn) : null;
  }
  return out;
}

// -------------------------------------------------------------- numbering --
function parseNumbering(doc) {
  const abstract = new Map();
  const nums = new Map();
  if (!doc) return { abstract, nums };
  const root = doc.documentElement;
  const parseLvl = (l) => ({
    ilvl: num(wv(l, 'ilvl')),
    start: num(wv(kid(l, 'start')), 1),
    fmt: wv(kid(l, 'numFmt')) || 'decimal',
    text: wv(kid(l, 'lvlText')) ?? '',
    jc: wv(kid(l, 'lvlJc')) || 'left',
    suff: wv(kid(l, 'suff')) || 'tab',
    pPr: kid(l, 'pPr'),
    rPr: kid(l, 'rPr'),
  });
  for (const a of kids(root, 'abstractNum')) {
    const levels = [];
    for (const l of kids(a, 'lvl')) levels[num(wv(l, 'ilvl'))] = parseLvl(l);
    abstract.set(wv(a, 'abstractNumId'), levels);
  }
  for (const n of kids(root, 'num')) {
    const overrides = {};
    for (const o of kids(n, 'lvlOverride')) {
      const ilvl = num(wv(o, 'ilvl'));
      overrides[ilvl] = {
        start: kid(o, 'startOverride') ? num(wv(kid(o, 'startOverride'))) : null,
        lvl: kid(o, 'lvl') ? parseLvl(kid(o, 'lvl')) : null,
      };
    }
    nums.set(wv(n, 'numId'), { abstractId: wv(kid(n, 'abstractNumId')), overrides });
  }
  return { abstract, nums };
}

function getLevel(numbering, numId, ilvl) {
  const n = numbering.nums.get(String(numId));
  if (!n) return null;
  const ov = n.overrides[ilvl];
  const base = (numbering.abstract.get(n.abstractId) || [])[ilvl];
  if (ov && ov.lvl) return ov.lvl;
  if (!base) return null;
  return ov && ov.start != null ? { ...base, start: ov.start } : base;
}

const ROMAN = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
function fmtNum(n, fmt) {
  switch (fmt) {
    case 'lowerLetter': case 'upperLetter': {
      let s = '';
      let k = n;
      while (k > 0) { k--; s = String.fromCharCode(97 + (k % 26)) + s; k = Math.floor(k / 26); }
      return fmt === 'upperLetter' ? s.toUpperCase() : s;
    }
    case 'lowerRoman': case 'upperRoman': {
      let s = '';
      let k = n;
      for (const [v, r] of ROMAN) while (k >= v) { s += r; k -= v; }
      return fmt === 'upperRoman' ? s.toUpperCase() : s;
    }
    case 'decimalZero': return (n < 10 ? '0' : '') + n;
    case 'none': return '';
    default: return String(n);
  }
}

// Map Symbol / Wingdings private-use code points to real Unicode characters.
const PUA = { 0xf0b7: '•', 0xf0a7: '▪', 0xf0d8: '➢', 0xf076: '❖', 0xf0fc: '✓', 0xf06e: '■', 0xf071: '❑', 0xf0a8: '◦', 0xf02d: '–' };
export function mapSymbolChars(s) {
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp >= 0xf000 && cp <= 0xf0ff) out += PUA[cp] || '•';
    else out += ch;
  }
  return out;
}

// ------------------------------------------------------------ main parse --
export function loadDocx(bytes, { limits } = {}) {
  const pkg = openPackage(bytes, limits);
  const mainRels = pkg.rels(pkg.main);
  const byType = (suffix) => {
    for (const r of mainRels.values()) if (r.type === REL + suffix) return r.target;
    return null;
  };
  const theme = parseTheme(pkg.xml(byType('theme') || 'word/theme/theme1.xml'));
  const styles = parseStyles(pkg.xml(byType('styles') || 'word/styles.xml'));
  const numbering = parseNumbering(pkg.xml(byType('numbering') || 'word/numbering.xml'));
  const settings = pkg.xml(byType('settings') || 'word/settings.xml');
  const defTab = settings ? twip(wv(descendants(settings.documentElement, 'defaultTabStop')[0]) || 720) : 36;
  // Layout-affecting compatibility switches (Word 2010 = mode 14, Word 2013+ = mode 15)
  const compat = { mode: 15, sumSpacing: false };
  if (settings) {
    for (const cs of descendants(settings.documentElement, 'compatSetting')) {
      if (wv(cs, 'name') === 'compatibilityMode') compat.mode = num(wv(cs), 15);
    }
    if (!descendants(settings.documentElement, 'compatSetting').length && descendants(settings.documentElement, 'compat').length) compat.mode = 12;
    compat.sumSpacing = !!onOff(descendants(settings.documentElement, 'doNotUseHTMLParagraphAutoSpacing')[0]);
  }
  const docXml = pkg.xml(pkg.main);
  if (!docXml) throw new DamagedError(`Not a readable Word file (${pkg.main} is missing or damaged)`);
  const body = kid(docXml.documentElement, 'body');
  const counters = new Map(); // numId -> counts[]
  const fontsUsed = new Set();
  const charsByFont = new Map(); // font key -> Set of characters (decides whether fallback fonts are needed)
  const ctx = { pkg, theme, styles, numbering, counters, fontsUsed, charsByFont, defTab };

  const sectPr = kid(body, 'sectPr') || descendants(body, 'sectPr').pop();
  const section = parseSection(sectPr, pkg, mainRels, ctx);
  const blocks = parseBlocks(body, { ...ctx, rels: mainRels, partPath: pkg.main, tableStyle: null });
  return { blocks, section, defTab, compat, fontsUsed, charsByFont, theme };
}

function parseSection(sectPr, pkg, rels, ctx) {
  const pgSz = kid(sectPr, 'pgSz');
  const pgMar = kid(sectPr, 'pgMar');
  const s = {
    width: twip(wv(pgSz, 'w') || 12240), height: twip(wv(pgSz, 'h') || 15840),
    top: twip(wv(pgMar, 'top') ?? 1440), bottom: twip(wv(pgMar, 'bottom') ?? 1440),
    left: twip(wv(pgMar, 'left') ?? 1440), right: twip(wv(pgMar, 'right') ?? 1440),
    header: twip(wv(pgMar, 'header') ?? 720), footer: twip(wv(pgMar, 'footer') ?? 720),
    titlePg: onOff(kid(sectPr, 'titlePg')) || false,
    headers: {}, footers: {},
  };
  if (wv(pgSz, 'orient') === 'landscape' && s.width < s.height) [s.width, s.height] = [s.height, s.width];
  for (const [tag, bag] of [['headerReference', s.headers], ['footerReference', s.footers]]) {
    for (const ref of kids(sectPr, tag)) {
      const rel = rels.get(attr(ref, 'r:id'));
      if (!rel) continue;
      const x = pkg.xml(rel.target);
      if (!x) continue;
      const partRels = pkg.rels(rel.target);
      bag[wv(ref, 'type') || 'default'] = parseBlocks(x.documentElement, { ...ctx, rels: partRels, partPath: rel.target, tableStyle: null });
    }
  }
  return s;
}

function parseBlocks(container, ctx) {
  const out = [];
  for (const el of kids(container)) {
    switch (el.localName) {
      case 'p': out.push(...parseParagraph(el, ctx)); break;
      case 'tbl': out.push(parseTable(el, ctx)); break;
      case 'sdt': out.push(...parseBlocks(kid(el, 'sdtContent'), ctx)); break;
      case 'customXml': out.push(...parseBlocks(el, ctx)); break;
      default: break;
    }
  }
  return out;
}

function resolveParaProps(pEl, ctx) {
  const { styles, numbering, theme } = ctx;
  const pPr = kid(pEl, 'pPr');
  const styleId = wv(kid(pPr, 'pStyle')) || styles.defPara;
  const P = { ...DEFAULT_PP, borders: {}, tabs: [] };
  const R = { ...DEFAULT_RP };
  applyPPr(P, styles.defaults.pPr);
  applyRPr(R, styles.defaults.rPr, theme);
  if (ctx.tableStyle) for (const s of chain(styles, ctx.tableStyle)) { applyPPr(P, s.pPr); applyRPr(R, s.rPr, theme); }
  const styleChain = chain(styles, styleId);
  // numbering may come from the style chain or direct formatting
  const probe = { ...DEFAULT_PP };
  for (const s of styleChain) applyPPr(probe, s.pPr);
  applyPPr(probe, pPr);
  const lvl = probe.numId && probe.numId !== '0' ? getLevel(numbering, probe.numId, probe.ilvl) : null;
  for (const s of styleChain) { applyPPr(P, s.pPr); applyRPr(R, s.rPr, theme); }
  if (lvl) applyPPr(P, lvl.pPr);
  applyPPr(P, pPr);
  P.styleId = styleId;
  return { P, R, lvl, styleChain };
}

function nextLabel(ctx, P, lvl, R) {
  const counts = ctx.counters.get(P.numId) || [];
  ctx.counters.set(P.numId, counts);
  const k = P.ilvl;
  counts[k] = counts[k] == null ? lvl.start : counts[k] + 1;
  for (let d = k + 1; d < 9; d++) counts[d] = undefined;
  let text = lvl.text;
  if (lvl.fmt === 'bullet') text = mapSymbolChars(text);
  else {
    text = text.replace(/%([1-9])/g, (_, d) => {
      const li = Number(d) - 1;
      const L = getLevel(ctx.numbering, P.numId, li) || lvl;
      const v = counts[li] == null ? L.start : counts[li];
      return fmtNum(v, L.fmt);
    });
  }
  const rp = { ...R };
  applyRPr(rp, lvl.rPr, ctx.theme);
  if (/^(symbol|wingdings)/i.test(rp.font)) rp.font = 'DejaVu Sans';
  rp.underline = false;
  ctx.fontsUsed.add(fontKey(rp));
  addChars(ctx, rp, text);
  return { text, rp, suff: lvl.suff, jc: lvl.jc };
}

export const fontKey = (rp) => `${rp.font}|${rp.bold ? 1 : 0}|${rp.italic ? 1 : 0}`;
function addChars(ctx, rp, text) {
  const k = fontKey(rp);
  let set = ctx.charsByFont.get(k);
  if (!set) ctx.charsByFont.set(k, (set = new Set()));
  for (const ch of text) set.add(ch);
  if (rp.caps) for (const ch of text.toUpperCase()) set.add(ch);
}

function parseParagraph(pEl, ctx) {
  const { P, R, lvl } = resolveParaProps(pEl, ctx);
  const markRp = { ...R };
  applyRPr(markRp, kid(kid(pEl, 'pPr'), 'rPr'), ctx.theme);
  ctx.fontsUsed.add(fontKey(markRp));
  const label = lvl ? nextLabel(ctx, P, lvl, markRp) : null;
  const items = [];
  const field = { state: 0, instr: '' }; // 0 none, 1 collecting instr, 2 in result
  const runProps = (rEl) => {
    const rp = { ...R };
    const rPr = kid(rEl, 'rPr');
    const rs = wv(kid(rPr, 'rStyle'));
    if (rs) for (const s of chain(ctx.styles, rs)) applyRPr(rp, s.rPr, ctx.theme);
    applyRPr(rp, rPr, ctx.theme);
    if (/^(symbol|wingdings|webdings)/i.test(rp.font)) rp.font = 'DejaVu Sans';
    ctx.fontsUsed.add(fontKey(rp));
    return rp;
  };
  const walkRun = (rEl, link) => {
    const rp = runProps(rEl);
    if (rp.hidden) return;
    if (link) { rp.color = rp.color || '#0563C1'; }
    for (const c of kids(rEl)) {
      const n = c.localName;
      if (n === 'fldChar') {
        const t = wv(c, 'fldCharType');
        if (t === 'begin') { field.state = 1; field.instr = ''; }
        else if (t === 'separate') {
          const code = field.instr.trim().split(/\s+/)[0].toUpperCase();
          if (code === 'PAGE' || code === 'NUMPAGES' || code === 'SECTIONPAGES') {
            items.push({ t: 'field', code, rp });
            addChars(ctx, rp, '0123456789');
            field.state = 3; // skip cached result
          } else field.state = 2;
        } else if (t === 'end') field.state = 0;
        continue;
      }
      if (field.state === 1) { if (n === 'instrText') field.instr += c.textContent; continue; }
      if (field.state === 3) continue;
      if (n === 't') { items.push({ t: 'text', text: c.textContent, rp, link }); addChars(ctx, rp, c.textContent); }
      else if (n === 'tab' || n === 'ptab') items.push({ t: 'tab', rp });
      else if (n === 'br' || n === 'cr') {
        const type = wv(c, 'type');
        items.push({ t: type === 'page' ? 'pagebreak' : 'br', rp });
      } else if (n === 'noBreakHyphen') items.push({ t: 'text', text: '‑', rp });
      else if (n === 'sym') {
        const ch = String.fromCharCode(parseInt(wv(c, 'char') || '2022', 16));
        items.push({ t: 'text', text: mapSymbolChars(ch), rp: { ...rp, font: 'DejaVu Sans' } });
        addChars(ctx, { ...rp, font: 'DejaVu Sans' }, mapSymbolChars(ch));
        ctx.fontsUsed.add(fontKey({ ...rp, font: 'DejaVu Sans' }));
      } else if (n === 'drawing') {
        const img = parseDrawing(c, ctx);
        if (img) items.push(img);
      } else if (n === 'AlternateContent') {
        const fb = kid(c, 'Fallback') || kid(c, 'Choice');
        const d = descendants(fb, 'drawing')[0];
        const img = d && parseDrawing(d, ctx);
        if (img) items.push(img);
      }
    }
  };
  const walk = (el, link) => {
    for (const c of kids(el)) {
      const n = c.localName;
      if (n === 'r') walkRun(c, link);
      else if (n === 'hyperlink') walk(c, attr(c, 'r:id') ? (ctx.rels.get(attr(c, 'r:id')) || {}).target || '#' : '#');
      else if (n === 'fldSimple') {
        const code = (wv(c, 'instr') || '').trim().split(/\s+/)[0].toUpperCase();
        if (code === 'PAGE' || code === 'NUMPAGES' || code === 'SECTIONPAGES') {
          const r0 = kid(c, 'r');
          const frp = r0 ? runProps(r0) : { ...R };
          items.push({ t: 'field', code, rp: frp });
          addChars(ctx, frp, '0123456789');
        } else walk(c, link);
      } else if (n === 'ins' || n === 'smartTag' || n === 'customXml' || n === 'dir' || n === 'bdo') walk(c, link);
      else if (n === 'sdt') walk(kid(c, 'sdtContent'), link);
    }
  };
  walk(pEl, null);
  // split at hard page breaks: [para-before] [pagebreak] [para-after]
  const out = [];
  let cur = [];
  const push = (its, first) => out.push({ kind: 'p', P, markRp, items: its, label: first ? label : null });
  let first = true;
  for (const it of items) {
    if (it.t === 'pagebreak') {
      if (cur.length || first) push(cur, first);
      out.push({ kind: 'pagebreak' });
      cur = [];
      first = false;
    } else cur.push(it);
  }
  if (first) push(cur, true);
  else if (cur.some((i) => i.t !== 'text' || i.text.trim())) push(cur, false);
  // a paragraph that only held a page break shouldn't leave an empty line before it
  if (out.length > 1 && out[0].kind === 'p' && !out[0].items.length && out[1].kind === 'pagebreak') out.shift();
  return out;
}

function parseDrawing(d, ctx) {
  const holder = kid(d, 'inline') || kid(d, 'anchor');
  if (!holder) return null;
  const ext = kid(holder, 'extent');
  const blip = descendants(holder, 'blip')[0];
  const rid = attr(blip, 'r:embed');
  if (!rid) return null;
  const rel = ctx.rels.get(rid);
  if (!rel || rel.external) return null;
  const data = ctx.pkg.bin(rel.target);
  if (!data) return null;
  const ext3 = rel.target.split('.').pop().toLowerCase();
  return {
    t: 'img', data, format: ext3, anchored: holder.localName === 'anchor',
    w: num(attr(ext, 'cx')) / 12700, h: num(attr(ext, 'cy')) / 12700,
  };
}

function tblProps(tblPr, T) {
  if (!tblPr) return;
  const b = kid(tblPr, 'tblBorders');
  if (b) for (const side of ['top', 'left', 'bottom', 'right', 'insideH', 'insideV', 'start', 'end']) {
    const v = parseBorder(kid(b, side));
    if (v !== undefined) T.borders[side === 'start' ? 'left' : side === 'end' ? 'right' : side] = v;
  }
  const m = kid(tblPr, 'tblCellMar');
  if (m) for (const side of ['top', 'left', 'bottom', 'right', 'start', 'end']) {
    const e = kid(m, side);
    if (e) T.margins[side === 'start' ? 'left' : side === 'end' ? 'right' : side] = twip(wv(e, 'w'));
  }
  const ind = kid(tblPr, 'tblInd');
  if (ind) T.indent = twip(wv(ind, 'w'));
  const jc = kid(tblPr, 'jc');
  if (jc) T.jc = wv(jc);
}

function parseTable(tblEl, ctx) {
  const tblPr = kid(tblEl, 'tblPr');
  const styleId = wv(kid(tblPr, 'tblStyle')) || ctx.styles.defTable;
  const T = { borders: {}, margins: { top: 0, bottom: 0, left: 5.4, right: 5.4 }, indent: 0, jc: 'left' };
  for (const s of chain(ctx.styles, styleId)) tblProps(s.tblPr, T);
  tblProps(tblPr, T);
  const grid = kids(kid(tblEl, 'tblGrid'), 'gridCol').map((g) => twip(wv(g, 'w')));
  const rows = [];
  const cellCtx = { ...ctx, tableStyle: styleId };
  for (const tr of kids(tblEl, 'tr')) {
    const trPr = kid(tr, 'trPr');
    const trH = kid(trPr, 'trHeight');
    const row = { cells: [], height: trH ? twip(wv(trH)) : 0, hRule: trH ? wv(trH, 'hRule') || 'atLeast' : null, header: !!onOff(kid(trPr, 'tblHeader')) };
    // gridBefore/gridSpan are file-supplied column counts; the layout allocates one entry per column
    const maxCols = ctx.pkg?.limits?.maxTableColumns ?? 1000;
    let col = 0;
    const before = kid(trPr, 'gridBefore');
    if (before) col += clampInt(num(wv(before)), 0, maxCols);
    for (const tc of kids(tr, 'tc')) {
      const tcPr = kid(tc, 'tcPr');
      const span = clampInt(num(wv(kid(tcPr, 'gridSpan')), 1), 1, Math.max(1, maxCols - col));
      const vm = kid(tcPr, 'vMerge');
      const shd = kid(tcPr, 'shd');
      const cb = {};
      const tcB = kid(tcPr, 'tcBorders');
      if (tcB) for (const side of ['top', 'left', 'bottom', 'right', 'start', 'end']) {
        const v = parseBorder(kid(tcB, side));
        if (v !== undefined) cb[side === 'start' ? 'left' : side === 'end' ? 'right' : side] = v;
      }
      const mar = { ...T.margins };
      const tcMar = kid(tcPr, 'tcMar');
      if (tcMar) for (const side of ['top', 'left', 'bottom', 'right']) if (kid(tcMar, side)) mar[side] = twip(wv(kid(tcMar, side), 'w'));
      row.cells.push({
        col, span,
        vMerge: vm ? wv(vm) || 'continue' : null,
        fill: shd && wv(shd, 'fill') && wv(shd, 'fill') !== 'auto' ? '#' + wv(shd, 'fill') : null,
        borders: cb, margins: mar,
        vAlign: wv(kid(tcPr, 'vAlign')) || 'top',
        blocks: parseBlocks(tc, cellCtx),
      });
      col += span;
    }
    rows.push(row);
  }
  return { kind: 'tbl', T, grid, rows };
}
