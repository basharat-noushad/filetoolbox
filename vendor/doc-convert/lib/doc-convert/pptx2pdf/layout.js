// Slide scene (model.js) -> display list pages for the shared PDF renderer.
// Text follows PowerPoint's model: single line spacing is 1.2 x the font size with the baseline 0.2 x size
// above the bottom of the line box, percentage paragraph spacing is a fraction of the font size, space
// before the first paragraph is ignored, and bullets hang in the paragraph's negative indent.
import { drawChart } from '../common/chart.js';
import { placePath } from './geom.js';
import { imageSize } from '../common/png.js';

const DESC = 0.2;
const SYMBOL_FONT = /^(wingdings( 2| 3)?|webdings|symbol|marlett|monotype sorts|zapf ?dingbats)$/i;
const WINGDINGS = {
  0x6c: '●', 0x6d: '❍', 0x6e: '■', 0x6f: '□', 0x70: '◻', 0x71: '❑', 0x72: '❒', 0x73: '⬧', 0x74: '⧫', 0x75: '◆', 0x76: '❖', 0x77: '⬥',
  0x78: '⌧', 0xa7: '▪', 0xa8: '◻', 0x9f: '•', 0xa1: '○', 0xd8: '➢', 0xe0: '→', 0xe8: '➔', 0xf0: '⇨', 0xfb: '✗', 0xfc: '✓', 0xfd: '☒', 0xfe: '☑',
};
const SYMBOL = { 0xb7: '•', 0xae: '→', 0xde: '⇒', 0xe0: '◊', 0x2d: '−', 0xa7: '♣', 0xa8: '♦', 0xa9: '♥', 0xaa: '♠', 0xb0: '°' };
// Wingdings 2 / 3 bullets used by the Office themes are small squares and arrowheads; map the common ones
// and use the family's typical shape for the rest
const WINGDINGS2 = { 0x97: '▪', 0x96: '▪', 0x98: '▪', 0xa0: '▪', 0xa2: '■', 0x9e: '•', 0xf0: '◆', 0xf1: '◆', 0x50: '✓', 0x4f: '✗', default: '▪' };
const WINGDINGS3 = { 0x7d: '▸', 0x75: '▸', 0x84: '▶', 0x70: '▲', 0x71: '▼', 0xc6: '➔', default: '▸' };
const SYMBOL_FACE = 'DejaVu Sans';

/** bullet character + font name to draw it with (symbol fonts are mapped to Unicode in DejaVu Sans) */
export function bulletGlyph(b) {
  if (b.type !== 'char') return null;
  const ch = b.char || '•';
  if (!SYMBOL_FONT.test(b.font || '')) {
    const cp = ch.codePointAt(0);
    if (cp >= 0xf000 && cp <= 0xf0ff) return { char: WINGDINGS[cp & 0xff] || '•', font: SYMBOL_FACE };
    return { char: ch, font: b.font };
  }
  let cp = ch.codePointAt(0);
  if (cp >= 0xf000 && cp <= 0xf0ff) cp &= 0xff;
  const f = b.font.toLowerCase();
  const table = f === 'symbol' ? SYMBOL : f === 'wingdings 2' ? WINGDINGS2 : f === 'wingdings 3' ? WINGDINGS3 : WINGDINGS;
  return { char: table[cp] || table.default || (cp > 0x7f ? '•' : ch), font: SYMBOL_FACE };
}

const ROMAN = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
function roman(n) { let s = ''; for (const [v, r] of ROMAN) while (n >= v) { s += r; n -= v; } return s; }
function alpha(n) { let s = ''; while (n > 0) { n -= 1; s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); } return s; }
export function autoNumber(scheme, n) {
  const m = /^(arabic|alphaLc|alphaUc|romanLc|romanUc|circleNum\w*|ea1\w*|hebrew\w*|thai\w*)(Period|ParenR|ParenBoth|Plain|Minus|DbPlain|DbPeriod|WdBlackPlain|WdWhitePlain)?/.exec(scheme || 'arabicPeriod') || [];
  const kind = m[1] || 'arabic';
  let core = String(n);
  if (kind === 'alphaLc') core = alpha(n);
  else if (kind === 'alphaUc') core = alpha(n).toUpperCase();
  else if (kind === 'romanLc') core = roman(n);
  else if (kind === 'romanUc') core = roman(n).toUpperCase();
  else if (kind.startsWith('circleNum') && n >= 1 && n <= 20) return String.fromCodePoint(0x2460 + n - 1);
  const suf = m[2] || 'Period';
  if (suf === 'ParenR') return core + ')';
  if (suf === 'ParenBoth') return `(${core})`;
  if (suf === 'Plain' || suf === 'DbPlain') return core;
  if (suf === 'Minus') return `- ${core} -`;
  return core + '.';
}

// ------------------------------------------------------------------ fonts --
const keyOf = (font, bold, italic) => `${font}|${bold ? 1 : 0}|${italic ? 1 : 0}`;
const caseText = (st, text) => (st.cap === 'all' || st.cap === 'small' ? text.toUpperCase() : text);

/** font keys + characters per key for every scene, so FontBook loads exactly what is needed */
export function collectFonts(scenes) {
  const keys = new Set();
  const chars = new Map();
  const add = (k, text) => {
    keys.add(k);
    let s = chars.get(k);
    if (!s) chars.set(k, (s = new Set()));
    for (const ch of text) s.add(ch);
  };
  const body = (tb) => {
    if (!tb) return;
    tb.paras.forEach((p) => {
      for (const r of p.runs) if (r.kind === 'text') add(keyOf(r.style.font, r.style.bold, r.style.italic), caseText(r.style, r.text));
      add(keyOf(p.end.font, p.end.bold, p.end.italic), ' ');
      if (p.bullet) {
        const g = bulletGlyph(p.bullet);
        if (g) add(keyOf(g.font, false, false), g.char);
        else add(keyOf(p.runs.find((r) => r.kind === 'text')?.style.font || p.end.font, false, false), '0123456789.)(ivxlcdmIVXLCDMabcdefghijklmnopqrstuvwxyz');
      }
    });
  };
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.kind === 'sp') body(n.text);
      else if (n.kind === 'grp') walk(n.children);
      else if (n.kind === 'tbl') for (const r of n.rows) for (const c of r.cells) body(c.text);
      else if (n.kind === 'chart') {
        const ch = n.chart;
        add(keyOf(n.font, false, false), [ch.title || '', ...ch.categories.map(String), ...ch.series.map((s) => s.name), '0123456789.,-kM%…'].join(''));
        if (ch.title) add(keyOf(n.font, true, false), ch.title + '…');
      }
    }
  };
  for (const s of scenes) walk(s.nodes);
  return { keys, chars };
}

// --------------------------------------------------------------- text engine --
const CJK = /[⺀-鿿가-힯豈-﫿＀-￯　-〿]/;

class TextEngine {
  constructor(fonts) { this.fonts = fonts; }

  rec(st, text, bold = st.bold, italic = st.italic, font = st.font) {
    const rp = { font, bold, italic };
    let rec = this.fonts.get(rp);
    if (text && !this.fonts.covers(rec, text)) rec = this.fonts.fallback(rp) || rec;
    return rec;
  }

  piece(kind, text, st, scale) {
    let size = st.size * scale;
    let rise = 0;
    if (st.baseline) { rise = st.baseline * size; size *= 2 / 3; }
    const rec = this.rec(st, kind === 'word' ? text : '');
    const w = kind === 'word' || kind === 'space' ? this.fonts.width(rec, size, text, st.spc) : 0;
    return { kind, text, st, rec, size, rise, w, line: st.size * scale };
  }

  /** split a word into pieces by font coverage (fallback font for symbols, Greek, etc.) and small caps */
  wordPieces(word, st, scale) {
    const out = [];
    const primary = this.fonts.get(st);
    let buf = '';
    let bufOk = null;
    const flush = () => {
      if (!buf) return;
      if (st.cap === 'small') {
        // small caps: originally-lowercase letters become 80% capitals
        for (const m of buf.match(/(\p{Ll}+|[^\p{Ll}]+)/gu) || []) {
          const lower = /\p{Ll}/u.test(m);
          const p = this.piece('word', m.toUpperCase(), lower ? { ...st, size: st.size * 0.8 } : st, scale);
          p.line = st.size * scale;
          out.push(p);
        }
      } else out.push(this.piece('word', st.cap === 'all' ? buf.toUpperCase() : buf, st, scale));
      buf = '';
    };
    for (const ch of word) {
      if (CJK.test(ch)) { flush(); const p = this.piece('word', ch, st, scale); p.breakBefore = true; p.breakAfter = true; out.push(p); continue; }
      const ok = this.fonts.covers(primary, ch);
      if (bufOk !== null && ok !== bufOk) flush();
      bufOk = ok;
      buf += ch;
    }
    flush();
    return out;
  }

  /** paragraph -> pieces */
  pieces(para, scale) {
    const out = [];
    for (const r of para.runs) {
      if (r.kind === 'br') { out.push({ ...this.piece('br', '', r.style, scale) }); continue; }
      for (const part of r.text.split(/(\t| +| )/)) {
        if (!part) continue;
        if (part === '\t') { out.push(this.piece('tab', '', r.style, scale)); continue; }
        if (/^ +$/.test(part)) { out.push(this.piece('space', part, r.style, scale)); continue; }
        // break opportunity after a hyphen or dash inside a word
        const segs = part.split(/(?<=[\p{L}\p{N}][-‐–—/])(?=[\p{L}\p{N}])/u);
        segs.forEach((seg, i) => {
          const ps = this.wordPieces(seg, r.style, scale);
          if (ps.length && i < segs.length - 1) ps[ps.length - 1].breakAfter = true;
          out.push(...ps);
        });
      }
    }
    return out;
  }

  /**
   * Lay out paragraphs into lines for a frame `width` wide (Infinity = no wrap).
   * Returns { lines: [...], height } with line positions relative to the top of the text block.
   */
  flow(paras, width, scale, lnRed) {
    const blocks = [];
    const counters = [];
    let y = 0;
    paras.forEach((para, pi) => {
      // numbering sequence across paragraphs of the same level
      for (let l = para.lvl + 1; l < 9; l++) counters[l] = undefined;
      let bulletText = null;
      let bulletSt = null;
      const firstSt = para.runs.find((r) => r.kind === 'text')?.style || para.end;
      if (para.bullet) {
        const b = para.bullet;
        if (b.type === 'num') {
          const c = counters[para.lvl];
          const n = c && c.scheme === b.scheme ? c.n + 1 : b.startAt;
          counters[para.lvl] = { scheme: b.scheme, n };
          bulletText = autoNumber(b.scheme, n);
          bulletSt = { ...firstSt, color: b.color, baseline: 0, u: null, strike: null, spc: 0, cap: 'none', link: null, highlight: null };
        } else {
          counters[para.lvl] = undefined;
          const g = bulletGlyph(b);
          bulletText = g.char;
          bulletSt = { ...firstSt, font: g.font, bold: false, italic: false, color: b.color, baseline: 0, u: null, strike: null, spc: 0, cap: 'none', link: null, highlight: null };
        }
        const pct = b.size?.pct ?? null;
        bulletSt.size = b.size?.pts ? b.size.pts : firstSt.size * (pct ?? 1);
      } else counters[para.lvl] = undefined;

      const bullet = bulletText ? this.piece('word', bulletText, bulletSt, scale) : null;
      const firstX = para.marL + para.indent;
      let textX0 = para.bullet ? para.marL : firstX;
      if (bullet && firstX + bullet.w > textX0 - 0.01) {
        // the bullet doesn't fit in the hanging indent: the text follows it after a small gap
        textX0 = firstX + bullet.w + bullet.size * 0.3;
      }
      const startFor = (i) => (i === 0 ? textX0 : para.marL);
      const availFor = (i) => width - startFor(i) - para.marR;
      const lines = this.breakLines(this.pieces(para, scale), availFor, startFor, para);
      // vertical metrics
      const pct = para.lnSpc.pct != null ? Math.max(0, para.lnSpc.pct - lnRed) : null;
      const endSize = para.end.size * scale;
      lines.forEach((ln, i) => {
        let size = 0;
        for (const p of ln.pieces) if (p.kind !== 'tab') size = Math.max(size, p.line);
        if (!size) size = ln.brSize || endSize;
        if (i === 0 && bullet) size = Math.max(size, bullet.line);
        ln.size = size;
        ln.pitch = pct != null ? 1.2 * size * pct : para.lnSpc.pts;
      });
      const sp = (s, size) => (!s ? 0 : s.pts != null ? s.pts : s.pct * size);
      if (pi > 0) y += sp(para.spcBef, lines[0].size);
      for (const ln of lines) {
        ln.top = y;
        ln.baseline = y + ln.pitch - DESC * ln.size;
        y += ln.pitch;
      }
      const after = sp(para.spcAft, lines[lines.length - 1].size);
      blocks.push({ para, lines, bullet, startFor, after });
      y += after;
    });
    const last = blocks[blocks.length - 1];
    return { blocks, height: Math.max(0, y - (last ? last.after : 0)) };
  }

  breakLines(pieces, availFor, startFor, para) {
    const lines = [];
    let cur = { pieces: [], w: 0, hasWord: false };
    const push = () => {
      // trailing spaces hang past the margin and don't count for alignment
      let w = cur.w;
      for (let k = cur.pieces.length - 1; k >= 0 && cur.pieces[k].kind === 'space'; k--) w -= cur.pieces[k].w;
      cur.textW = w;
      lines.push(cur);
      cur = { pieces: [], w: 0, hasWord: false };
    };
    let i = 0;
    while (i < pieces.length) {
      const p = pieces[i];
      if (p.kind === 'br') { cur.brSize = p.line; cur.hard = true; push(); i++; continue; }
      if (p.kind === 'space') { cur.pieces.push(p); cur.w += p.w; i++; continue; }
      if (p.kind === 'tab') {
        const x = startFor(lines.length) + cur.w;
        const stop = para.tabs.find((t) => t.pos > x + 0.5);
        const pos = stop ? stop.pos : (Math.floor(x / para.defTab + 1e-6) + 1) * para.defTab;
        const t = { ...p, w: pos - x };
        cur.pieces.push(t);
        cur.w += t.w;
        i++;
        continue;
      }
      // a glued word segment (run changes inside a word don't create break opportunities)
      const seg = [];
      let segW = 0;
      let j = i;
      while (j < pieces.length && pieces[j].kind === 'word') {
        if (seg.length && pieces[j].breakBefore) break;
        seg.push(pieces[j]);
        segW += pieces[j].w;
        j++;
        if (pieces[j - 1].breakAfter) break;
      }
      const avail = availFor(lines.length);
      if (cur.hasWord && cur.w + segW > avail + 0.01) { push(); continue; }
      if (!cur.hasWord && cur.w + segW > avail + 0.01 && Number.isFinite(avail)) {
        // longer than a whole line: break inside the word, character by character
        for (const sp of seg) {
          let rest = sp.text;
          while (rest) {
            const room = availFor(lines.length) - cur.w;
            let n = 0;
            let w = 0;
            for (const ch of rest) {
              const cw = this.fonts.width(sp.rec, sp.size, ch, sp.st.spc);
              if (n > 0 && w + cw > room + 0.01) break;
              w += cw;
              n += ch.length;
            }
            if (n === 0) n = rest.length;
            const head = rest.slice(0, n);
            rest = rest.slice(n);
            const piece = { ...sp, text: head, w: this.fonts.width(sp.rec, sp.size, head, sp.st.spc) };
            cur.pieces.push(piece);
            cur.w += piece.w;
            cur.hasWord = true;
            if (rest) push();
          }
        }
        i = j;
        continue;
      }
      cur.pieces.push(...seg);
      cur.w += segW;
      cur.hasWord = true;
      i = j;
    }
    if (cur.pieces.length || !lines.length || lines[lines.length - 1].hard) push();
    return lines;
  }

  /**
   * Draw a text body into `items` inside `rect` (the shape's text rectangle, before insets).
   * opts: { insets?, anchor?, clip? }
   */
  draw(tb, rect, items, opts = {}) {
    const bp = tb.bodyPr || {};
    const ins = opts.insets || { l: bp.lIns ?? 7.2, t: bp.tIns ?? 3.6, r: bp.rIns ?? 7.2, b: bp.bIns ?? 3.6 };
    let frame = { x: rect.x + ins.l, y: rect.y + ins.t, w: rect.w - ins.l - ins.r, h: rect.h - ins.t - ins.b };
    const vert = bp.vert && bp.vert !== 'horz' ? bp.vert : null;
    let rot = 0;
    if (vert === 'vert' || vert === 'eaVert' || vert === 'wordArtVertRtl') rot = 90;
    else if (vert === 'vert270') rot = 270;
    const cx = frame.x + frame.w / 2;
    const cy = frame.y + frame.h / 2;
    if (rot) frame = { x: cx - frame.h / 2, y: cy - frame.w / 2, w: frame.h, h: frame.w };
    const wrap = bp.wrap !== 'none';
    const width = wrap ? Math.max(1, frame.w) : Infinity;
    let scale = 1;
    let lnRed = 0;
    if (bp.autofit?.type === 'norm') { scale = bp.autofit.fontScale || 1; lnRed = bp.autofit.lnSpcReduction || 0; }
    // "shrink text on overflow": PowerPoint stores the scale it used (fontScale / lnSpcReduction) and renders
    // with exactly that; without a stored scale the text fitted when the file was saved, so none is applied
    const flow = this.flow(tb.paras, width, scale, lnRed);
    const anchor = opts.anchor || bp.anchor || 't';
    let y0 = frame.y;
    if (anchor === 'ctr') y0 = frame.y + (frame.h - flow.height) / 2;
    else if (anchor === 'b') y0 = frame.y + frame.h - flow.height;
    const out = rot ? [] : items;
    for (const blk of flow.blocks) this.emit(blk, frame, y0, out);
    if (rot) items.push({ t: 'group', rot, cx, cy, items: out });
  }

  emit(blk, frame, y0, out) {
    const { para, lines, bullet } = blk;
    lines.forEach((ln, li) => {
      const baseline = y0 + ln.baseline;
      const start = blk.startFor(li);
      // alignment is always relative to the frame, also for unwrapped text (which may overflow both sides)
      const avail = frame.w - start - para.marR;
      let x = frame.x + start;
      const free = avail - ln.textW;
      const last = li === lines.length - 1 || ln.hard;
      let gap = 0;
      if (para.algn === 'ctr') x += free / 2;
      else if (para.algn === 'r') x += free;
      else if ((para.algn === 'just' || para.algn === 'dist') && !last && free > 0) {
        let trailing = ln.pieces.length;
        while (trailing > 0 && ln.pieces[trailing - 1].kind === 'space') trailing--;
        const spaces = ln.pieces.slice(0, trailing).filter((p) => p.kind === 'space').length;
        if (spaces) gap = free / spaces;
      }
      if (li === 0 && bullet) {
        const bx = frame.x + para.marL + para.indent + (para.algn === 'ctr' || para.algn === 'r' ? x - (frame.x + start) : 0);
        out.push({ t: 'text', x: bx, y: baseline, text: bullet.text, rec: bullet.rec, size: bullet.size, color: bullet.st.color });
      }
      // trailing spaces are not drawn (and not underlined)
      let end = ln.pieces.length;
      while (end > 0 && ln.pieces[end - 1].kind === 'space') end--;
      let run = null;
      const flushRun = () => {
        if (!run) return;
        if (run.text.trim() || run.st.highlight) {
          const st = run.st;
          if (st.highlight) out.push({ t: 'rect', x: run.x, y: baseline - run.size * 0.95 - run.rise, w: run.w, h: run.size * 1.2, fill: st.highlight });
          if (st.alpha > 0) out.push({ t: 'text', x: run.x, y: baseline - run.rise, text: run.text, rec: run.rec, size: run.size, color: st.color, cs: st.spc || 0, link: st.link || undefined, opacity: st.alpha < 1 ? st.alpha : undefined });
        }
        decorate(out, run, baseline);
        run = null;
      };
      for (let k = 0; k < end; k++) {
        const p = ln.pieces[k];
        const w = p.w + (p.kind === 'space' ? gap : 0);
        if (p.kind === 'tab') { flushRun(); x += w; continue; }
        const same = run && run.rec === p.rec && run.size === p.size && run.rise === p.rise && run.st.color === p.st.color && run.st.link === p.st.link
          && run.st.u === p.st.u && run.st.strike === p.st.strike && run.st.highlight === p.st.highlight && run.st.spc === p.st.spc && !gap;
        if (same) { run.text += p.text; run.w += w; } else { flushRun(); run = { x, w, text: p.text, rec: p.rec, size: p.size, rise: p.rise, st: p.st }; }
        x += w;
      }
      flushRun();
    });
  }
}

function decorate(out, run, baseline) {
  const st = run.st;
  if (st.u) {
    const y = baseline - run.rise + (run.rec.ulPos || 0.1) * run.size;
    const w = Math.max(0.5, (run.rec.ulThick || 0.05) * run.size * (st.u === 'heavy' ? 2 : 1));
    out.push({ t: 'line', x1: run.x, y1: y, x2: run.x + run.w, y2: y, w, color: st.color });
    if (st.u === 'dbl') out.push({ t: 'line', x1: run.x, y1: y + w * 2, x2: run.x + run.w, y2: y + w * 2, w, color: st.color });
  }
  if (st.strike) {
    const y = baseline - run.rise - run.size * 0.3;
    out.push({ t: 'line', x1: run.x, y1: y, x2: run.x + run.w, y2: y, w: Math.max(0.5, run.size * 0.05), color: st.color });
    if (st.strike === 'dblStrike') out.push({ t: 'line', x1: run.x, y1: y - run.size * 0.08, x2: run.x + run.w, y2: y - run.size * 0.08, w: Math.max(0.5, run.size * 0.05), color: st.color });
  }
}

// ------------------------------------------------------------------ shapes --
function lineProps(line) {
  if (!line) return {};
  const lw = Math.max(0.1, line.w);
  return {
    stroke: line.color, lw, strokeOpacity: line.alpha < 1 ? line.alpha : undefined,
    dash: line.dash ? line.dash.map((v) => v * Math.max(lw, 0.75)) : undefined,
    cap: line.cap, join: line.join,
  };
}
function fillProps(fill) {
  if (!fill || fill.img) return {};
  return { fill: fill.grad || fill.color, opacity: fill.alpha < 1 ? fill.alpha : undefined };
}

const ARROW = { sm: 2, med: 3, lg: 5 };
/** arrowhead at the end of a path, pointing from (x0,y0) to (x1,y1) */
function arrowHead(out, end, x0, y0, x1, y1, line) {
  const base = Math.max(line.w, 1.5);
  const len = ARROW[end.len] * base;
  const half = (ARROW[end.w] * base) / 2;
  const d = Math.hypot(x1 - x0, y1 - y0) || 1;
  const ux = (x1 - x0) / d;
  const uy = (y1 - y0) / d;
  const bx = x1 - ux * len;
  const by = y1 - uy * len;
  const nx = -uy * half;
  const ny = ux * half;
  const color = line.color;
  if (end.type === 'oval') {
    out.push({ t: 'shape', kind: 'ellipse', x: x1 - half, y: y1 - half, w: half * 2, h: half * 2, fill: color });
  } else if (end.type === 'diamond') {
    out.push({ t: 'path', d: [['M', x1 + ux * len / 2, y1 + uy * len / 2], ['L', x1 + nx, y1 + ny], ['L', x1 - ux * len / 2, y1 - uy * len / 2], ['L', x1 - nx, y1 - ny], ['Z']], fill: color });
  } else if (end.type === 'arrow') {
    out.push({ t: 'path', d: [['M', bx + nx, by + ny], ['L', x1, y1], ['L', bx - nx, by - ny]], stroke: color, lw: line.w, join: 'miter' });
  } else {
    const notch = end.type === 'stealth' ? len * 0.35 : 0;
    out.push({ t: 'path', d: [['M', x1, y1], ['L', bx + nx, by + ny], ['L', bx + ux * notch, by + uy * notch], ['L', bx - nx, by - ny], ['Z']], fill: color });
  }
  return end.type === 'triangle' || end.type === 'stealth' ? len * 0.7 : 0;
}

function endPoints(d) {
  const pts = [];
  for (const c of d) if (c[0] !== 'Z') for (let i = 1; i < c.length; i += 2) pts.push([c[i], c[i + 1]]);
  return pts;
}

function trimPath(d, atStart, atEnd) {
  // pull the first / last point back along its segment so the line ends inside the arrowhead
  const out = d.map((c) => c.slice());
  const move = (cmd, ix, fromX, fromY, by) => {
    const x = cmd[ix];
    const y = cmd[ix + 1];
    const len = Math.hypot(x - fromX, y - fromY);
    if (len <= by || len === 0) return;
    cmd[ix] = x + ((fromX - x) / len) * by;
    cmd[ix + 1] = y + ((fromY - y) / len) * by;
  };
  if (atStart && out.length > 1) { const n = out[1]; move(out[0], 1, n[n.length - 2], n[n.length - 1], atStart); }
  if (atEnd && out.length > 1) {
    const li = out.length - 1;
    const last = out[li];
    if (last[0] !== 'Z') {
      const prev = last[0] === 'C' ? [last[3], last[4]] : (() => { const p = out[li - 1]; return [p[p.length - 2], p[p.length - 1]]; })();
      move(last, last.length - 2, prev[0], prev[1], atEnd);
    }
  }
  return out;
}

export class SlideRenderer {
  constructor(fonts) {
    this.fonts = fonts;
    this.text = new TextEngine(fonts);
  }

  page(scene) {
    const items = [];
    const { width, height, bg } = scene;
    if (bg?.img) items.push(...this.fillImage(bg.img, { x: 0, y: 0, w: width, h: height }));
    else items.push({ t: 'rect', x: 0, y: 0, w: width, h: height, fill: bg ? bg.grad || bg.color : '#FFFFFF' });
    for (const n of scene.nodes) this.node(n, items);
    return { width, height, ordered: true, items };
  }

  node(n, out) {
    switch (n.kind) {
      case 'sp': return this.shape(n, out);
      case 'pic': return this.picture(n, out);
      case 'tbl': return this.table(n, out);
      case 'chart': return this.chart(n, out);
      case 'grp': {
        const items = [];
        for (const c of n.children) this.node(c, items);
        if (!n.box || (!n.rot && !n.flipH && !n.flipV)) { out.push(...items); return null; }
        out.push({ t: 'group', rot: n.rot, flipH: n.flipH, flipV: n.flipV, cx: n.box.x + n.box.w / 2, cy: n.box.y + n.box.h / 2, items });
        return null;
      }
      default: return null;
    }
  }

  wrap(n, out) {
    if (!n.rot) return out;
    const items = [];
    out.push({ t: 'group', rot: n.rot, cx: n.box.x + n.box.w / 2, cy: n.box.y + n.box.h / 2, items });
    return items;
  }

  shape(n, outer) {
    const out = this.wrap(n, outer);
    const { box, geom } = n;
    for (const p of geom.paths) {
      let d = placePath(p.d, box, n.flipH, n.flipV);
      const fill = p.fill ? n.fill : null;
      const stroke = p.stroke ? n.line : null;
      if (fill?.img) {
        out.push({ t: 'group', clipPath: d, items: this.fillImage(fill.img, box) });
      }
      if (stroke && (stroke.head || stroke.tail) && !p.fill) {
        const pts = endPoints(d);
        let a = 0;
        let b = 0;
        if (pts.length > 1) {
          if (stroke.head) a = arrowHead(out, stroke.head, pts[1][0], pts[1][1], pts[0][0], pts[0][1], stroke);
          if (stroke.tail) b = arrowHead(out, stroke.tail, pts[pts.length - 2][0], pts[pts.length - 2][1], pts[pts.length - 1][0], pts[pts.length - 1][1], stroke);
          d = trimPath(d, a, b);
        }
      }
      if ((fill && !fill.img) || stroke) out.push({ t: 'path', d, box, evenOdd: p.evenOdd, ...fillProps(fill), ...lineProps(stroke) });
    }
    if (n.text) {
      const t = geom.text;
      let l = t.l;
      let r = t.r;
      let tt = t.t;
      let b = t.b;
      if (n.flipH) [l, r] = [box.w - r, box.w - l];
      if (n.flipV) [tt, b] = [box.h - b, box.h - tt];
      this.text.draw(n.text, { x: box.x + l, y: box.y + tt, w: r - l, h: b - tt }, out);
    }
    return null;
  }

  /** picture fill: stretched, or tiled at the picture's own size (scaled by the tile's sx/sy) */
  fillImage(img, box) {
    const t = img.tile;
    const sz = t && imageSize(img.data);
    if (!sz) return [this.imageItem(img, box)];
    const tw = (sz.w * 72) / sz.dpi * t.sx;
    const th = (sz.h * 72) / sz.dpi * t.sy;
    if (!(tw > 0.5 && th > 0.5) || (box.w / tw) * (box.h / th) > 600) return [this.imageItem({ ...img, tile: null }, box)];
    const items = [];
    const x0 = box.x + (((t.tx % tw) + tw) % tw) - tw;
    const y0 = box.y + (((t.ty % th) + th) % th) - th;
    for (let y = y0; y < box.y + box.h; y += th) {
      for (let x = x0; x < box.x + box.w; x += tw) items.push({ t: 'img', x, y, w: tw, h: th, data: img.data, format: img.format, opacity: img.alpha < 1 ? img.alpha : undefined });
    }
    return items;
  }

  imageItem(img, box) {
    const c = img.crop;
    if (!c || (!c.l && !c.t && !c.r && !c.b)) return { t: 'img', ...box, data: img.data, format: img.format, opacity: img.alpha < 1 ? img.alpha : undefined };
    const fw = box.w / (1 - c.l - c.r || 1);
    const fh = box.h / (1 - c.t - c.b || 1);
    return { t: 'img', x: box.x - c.l * fw, y: box.y - c.t * fh, w: fw, h: fh, data: img.data, format: img.format, clip: box, opacity: img.alpha < 1 ? img.alpha : undefined };
  }

  picture(n, outer) {
    let out = this.wrap(n, outer);
    const { box } = n;
    if (n.flipH || n.flipV) {
      const items = [];
      out.push({ t: 'group', flipH: n.flipH, flipV: n.flipV, cx: box.x + box.w / 2, cy: box.y + box.h / 2, items });
      out = items;
    }
    if (n.img) {
      const it = this.imageItem(n.img, box);
      if (n.geom) out.push({ t: 'group', clipPath: placePath(n.geom.paths[0].d, box), items: [{ ...it, clip: undefined }] });
      else out.push(it);
    } else out.push({ t: 'rect', ...box, fill: '#F2F2F2', stroke: '#BFBFBF', lw: 0.5 });
    if (n.line) {
      const d = n.geom ? placePath(n.geom.paths[0].d, box) : [['M', box.x, box.y], ['L', box.x + box.w, box.y], ['L', box.x + box.w, box.y + box.h], ['L', box.x, box.y + box.h], ['Z']];
      out.push({ t: 'path', d, ...lineProps(n.line) });
    }
    return null;
  }

  chart(n, out) {
    const recBase = this.fonts.get({ font: n.font, bold: false, italic: false });
    drawChart(out, n.chart, n.box, {
      frame: false,
      measure: (s, size) => this.fonts.width(recBase, size, String(s)),
      text: (s, x, y, size, o = {}) => {
        const rec = o.bold ? this.fonts.get({ font: n.font, bold: true, italic: false }) : recBase;
        let str = String(s);
        const maxW = o.maxW || Infinity;
        while (str.length > 1 && this.fonts.width(rec, size, str) > maxW) str = str.slice(0, -2) + '…';
        const w = this.fonts.width(rec, size, str);
        const tx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
        out.push({ t: 'text', x: tx, y, text: str, rec, size, color: o.color || '#000000' });
      },
    });
  }

  table(n, out) {
    const { box, cols, rows } = n;
    const X = [box.x];
    for (const w of cols) X.push(X[X.length - 1] + w);
    const nC = cols.length;
    const H = rows.map((r) => r.h);
    const vertical = (cell) => cell.vert && cell.vert !== 'horz';
    const need = (cell) => {
      // vertical text wraps at the row height instead of growing it
      if (!cell.text || vertical(cell)) return cell.mar.t + cell.mar.b;
      const w = X[Math.min(nC, cell.c + cell.gridSpan)] - X[cell.c] - cell.mar.l - cell.mar.r;
      const f = this.text.flow(cell.text.paras, Math.max(1, w), 1, 0);
      return f.height + cell.mar.t + cell.mar.b;
    };
    rows.forEach((r, ri) => { for (const c of r.cells) if (!c.covered && c.rowSpan === 1) H[ri] = Math.max(H[ri], need(c)); });
    rows.forEach((r, ri) => {
      for (const c of r.cells) {
        if (c.covered || c.rowSpan <= 1) continue;
        const span = H.slice(ri, ri + c.rowSpan).reduce((a, b) => a + b, 0);
        const req = need(c);
        if (req > span) H[Math.min(rows.length - 1, ri + c.rowSpan - 1)] += req - span;
      }
    });
    const Y = [box.y];
    for (const h of H) Y.push(Y[Y.length - 1] + h);
    const cellBox = (c) => ({ x: X[c.c], y: Y[c.r], w: X[Math.min(nC, c.c + c.gridSpan)] - X[c.c], h: Y[Math.min(rows.length, c.r + c.rowSpan)] - Y[c.r] });
    const borders = [];
    for (const r of rows) {
      for (const c of r.cells) {
        if (c.covered) continue;
        const b = cellBox(c);
        if (c.fill && !c.fill.img) out.push({ t: 'rect', ...b, fill: c.fill.grad || c.fill.color, opacity: c.fill.alpha < 1 ? c.fill.alpha : undefined });
        if (c.text) {
          const tb = vertical(c) ? { ...c.text, bodyPr: { ...c.text.bodyPr, vert: c.vert } } : c.text;
          this.text.draw(tb, b, out, { insets: c.mar, anchor: c.anchor === 'ctr' ? 'ctr' : c.anchor === 'b' ? 'b' : 't' });
        }
        const bd = c.borders;
        const edge = (ln, x1, y1, x2, y2) => { if (ln) borders.push({ t: 'line', x1, y1, x2, y2, w: ln.w, color: ln.color, dash: ln.dash ? ln.dash.map((v) => v * Math.max(ln.w, 0.75)) : undefined }); };
        edge(bd.top, b.x, b.y, b.x + b.w, b.y);
        edge(bd.bottom, b.x, b.y + b.h, b.x + b.w, b.y + b.h);
        edge(bd.left, b.x, b.y, b.x, b.y + b.h);
        edge(bd.right, b.x + b.w, b.y, b.x + b.w, b.y + b.h);
      }
    }
    // borders after all fills so neighbouring cells don't paint over them; thicker lines last
    borders.sort((a, b) => a.w - b.w);
    out.push(...borders);
  }
}
