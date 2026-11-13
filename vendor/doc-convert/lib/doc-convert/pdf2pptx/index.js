// PDF -> .pptx: one slide per page. Text becomes editable text boxes (lines that belong together form one
// box, one paragraph per line, with the original fonts, sizes, colours and line spacing); pictures and vector
// artwork are placed where they were, in their original paint order.
import { extractPdf, scanStats } from '../pdf2docx/extract.js';
import { buildLines } from '../pdf2docx/analyze.js';
import { writePptx } from '../common/pptx-writer.js';

export async function pdfToPptx(bytes, { pdfjs, maxPages, title = '', pdfOptions, limits, ocr, onProgress } = {}) {
  const extracted = await extractPdf(bytes, { pdfjs, maxPages, pdfOptions, limits, ocr, onProgress });
  const { pages } = extracted;
  // a presentation has one slide size: the first page's; other pages are scaled to fit and centred
  const W = pages[0]?.width || 720;
  const H = pages[0]?.height || 540;
  const stats = { pages: pages.length, textBoxes: 0, images: 0, shapes: 0, ...scanStats(extracted) };
  const slides = pages.map((p) => pageToSlide(p, W, H, stats));
  return { pptx: writePptx({ width: W, height: H, slides, title }), stats };
}

const sameStyle = (a, b) => a.family === b.family && !!a.bold === !!b.bold && !!a.italic === !!b.italic
  && Math.abs(a.size - b.size) < 0.25 && a.color === b.color && !!a.underline === !!b.underline && a.link === b.link && Math.abs((a.rise || 0) - (b.rise || 0)) < 0.5;

// split a line where the gap between words is wide enough to be a column break
function segments(ln) {
  const out = [];
  let cur = null;
  let prev = null;
  for (const t of ln.tokens) {
    if (t.space) { if (cur) cur.tokens.push(t); continue; }
    // a new segment at a column-sized gap, or where same-size text sits on a different baseline
    // (two neighbouring lines the line builder merged; real super/subscripts are smaller)
    const jump = prev && Math.abs(t.y - prev.y) > 0.15 * Math.max(t.size, prev.size) && Math.min(t.size, prev.size) > 0.85 * Math.max(t.size, prev.size);
    if (!cur || jump || (prev && t.x0 - prev.x1 > 1.6 * Math.max(t.size, prev.size))) {
      cur = { tokens: [], x0: t.x0, x1: t.x1, y: t.y, size: 0 };
      out.push(cur);
    }
    cur.tokens.push(t);
    cur.x1 = Math.max(cur.x1, t.x1);
    if (t.size > cur.size) { cur.size = t.size; cur.y = t.y; } // the baseline of the main (largest) text
    prev = t;
  }
  for (const s of out) while (s.tokens.length && s.tokens[s.tokens.length - 1].space) s.tokens.pop();
  return out;
}

/** line segment -> runs. Gaps far wider than a space become a tab with a stop at the next word (left-aligned
 * boxes only), so bullets and in-line columns keep their positions; `left` is the box's left edge in PDF units. */
function runsOf(seg, k, links, tabs, left, useTabs, list = {}) {
  const runs = [];
  let lastSolid = null;
  let pendingSpace = false;
  let firstWord = '';
  let words = 0;
  for (const t of seg.tokens) {
    if (t.space) { pendingSpace = true; continue; }
    let sep = '';
    if (lastSolid) {
      const gap = t.x0 - lastSolid.x1;
      // after a list marker (•, –, "1.", "a)") any visible gap is the hanging indent; elsewhere only a wide one
      const marker = words === 0 && firstWord.length <= 4 && /^([•▪◦‣∙·–—\-*>]|\(?[0-9a-zA-Z]{1,2}[.)])$/.test(firstWord);
      if (useTabs && marker && gap > 0.3 * t.size) {
        // list item: the marker hangs in a negative indent and the text starts at the paragraph margin
        list.textX = (t.x0 - left) * k;
        list.markerX = (lastSolid.x0 - left) * k - (lastSolid.x0 - seg.tokens.find((x) => !x.space).x0) * k;
        list.marker = firstWord;
        list.isBullet = /^[•▪◦‣∙·–—\-*>]$/.test(firstWord);
        sep = '\t';
      } else if (useTabs && gap > 1.0 * t.size) { sep = '\t'; tabs.push((t.x0 - left) * k); } else if (pendingSpace || gap > 0.15 * t.size) sep = ' ';
      if (sep) words++;
    }
    pendingSpace = false;
    if (!words) firstWord += t.ch >= '\uf000' && t.ch <= '\uf0ff' ? '•' : t.ch;
    const rise = t.size < 0.85 * seg.size && Math.abs(seg.y - t.y) > 0.1 * seg.size ? seg.y - t.y : 0;
    const cx = (t.x0 + t.x1) / 2;
    const link = links.find((l) => cx >= l.x0 && cx <= l.x1 && t.y >= l.y0 - 1 && t.y <= l.y1 + t.size)?.url;
    const st = { family: t.family, bold: t.bold, italic: t.italic, size: t.size, color: t.color, underline: t.underline, link, rise };
    const ch = t.ch >= '\uf000' && t.ch <= '\uf0ff' ? '•' : t.ch; // symbol-font bullets
    const last = runs[runs.length - 1];
    if (sep && last) last.text += sep;
    if (last && sameStyle(last.st, st)) last.text += ch;
    else runs.push({ st, text: ch });
    lastSolid = t;
  }
  const out = runs.map(({ st, text }) => ({
    text, font: cleanFamily(st.family), size: Math.round(st.size * k * 2) / 2 || 1, bold: st.bold, italic: st.italic, color: st.color || '#000000',
    u: st.underline, link: st.link, baseline: st.rise ? Math.max(-0.5, Math.min(0.5, st.rise / st.size)) : 0,
  }));
  if (list.isBullet && out.length) {
    // a real bullet: drop the marker text (and its tab) and describe it as the paragraph's bullet
    const first = out[0];
    const cut = first.text.indexOf('\t');
    list.bullet = { char: list.marker, font: first.font, color: first.color, size: first.size };
    if (cut >= 0) first.text = first.text.slice(cut + 1);
    if (!first.text) out.shift();
    if (out[0]) list.bullet.sizePct = Math.max(0.25, Math.min(4, list.bullet.size / out[0].size));
  }
  return out;
}

function cleanFamily(f) {
  if (!f || /^(F\d+|T\d+|TT\d+|C\d+_\d+|Font\d*)$/i.test(f)) return null; // anonymous embedded fonts: theme font
  return f.replace(/(PS)?MT$/, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim() || null;
}

function pageToSlide(p, W, H, stats) {
  const k = Math.min(W / p.width, H / p.height);
  const ox = (W - p.width * k) / 2;
  const oy = (H - p.height * k) / 2;
  const X = (x) => ox + x * k;
  const Y = (y) => oy + y * k;
  const items = [];
  // artwork in paint order; consecutive paths with the same look become one freeform
  const art = [...p.paths.map((x) => ({ ...x, kind: 'path' })), ...p.images.filter((i) => i.png).map((x) => ({ ...x, kind: 'img' }))].sort((a, b) => a.z - b.z);
  let merged = null;
  const flush = () => { if (merged) { items.push(merged); stats.shapes++; merged = null; } };
  for (const a of art) {
    if (a.kind === 'img') {
      flush();
      items.push({ t: 'image', x: X(a.x0), y: Y(a.y0), w: (a.x1 - a.x0) * k, h: (a.y1 - a.y0) * k, data: a.png, format: a.format || 'png' });
      stats.images++;
      continue;
    }
    // a white rectangle covering the page is the paper, not content
    const d = a.d.map((c) => (c[0] === 'Z' ? c : [c[0], ...c.slice(1).map((v, i) => (i % 2 ? Y(v) : X(v)))]));
    if (!a.stroke && /^#?f{6}$/i.test(String(a.fill || '').replace('#', '').padEnd(6, 'f')) && a.d.length <= 6) {
      const xs = d.flatMap((c) => c.slice(1).filter((_, i) => i % 2 === 0));
      const ys = d.flatMap((c) => c.slice(1).filter((_, i) => i % 2 === 1));
      if (Math.max(...xs) - Math.min(...xs) >= W * 0.95 && Math.max(...ys) - Math.min(...ys) >= H * 0.95) continue;
    }
    const lw = a.lw * k;
    if (merged && !a.evenOdd && !merged.evenOdd && merged.fill === a.fill && merged.stroke === a.stroke && Math.abs(merged.lw - lw) < 0.01 && merged.d.length + d.length < 4000) {
      merged.d.push(...d);
    } else {
      flush();
      merged = { t: 'path', d: [...d], fill: a.fill, stroke: a.stroke, lw, evenOdd: a.evenOdd };
    }
  }
  flush();

  // text: horizontal text in page space; rotated text laid out in its own rotated frame and turned back
  const flat = p.glyphs.filter((g) => !g.invisible);
  const horiz = flat.filter((g) => !g.rotated);
  items.push(...textItems(horiz, p.links, k, (x0, top, w, h) => ({ x: X(x0), y: Y(top), w: w * k, h: h * k }), stats));
  const byAngle = new Map();
  for (const g of flat) if (g.rotated && g.ang != null) { const a = Math.round(g.ang); if (!byAngle.has(a)) byAngle.set(a, []); byAngle.get(a).push(g); }
  for (const [deg, gs] of byAngle) {
    const t = (deg * Math.PI) / 180;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    // page -> frame: rotate by -angle so the baseline runs along +x
    const framed = gs.map((g) => {
      const u = g.ox * cos + g.oy * sin;
      const v = -g.ox * sin + g.oy * cos;
      return { ...g, x0: u, x1: u + g.adv, y: v, rotated: false };
    });
    items.push(...textItems(framed, [], k, (x0, top, w, h) => {
      const uc = x0 + w / 2;
      const vc = top + h / 2;
      const cx = uc * cos - vc * sin;
      const cy = uc * sin + vc * cos;
      return { x: X(cx) - (w * k) / 2, y: Y(cy) - (h * k) / 2, w: w * k, h: h * k, rot: deg };
    }, stats));
  }
  return { items };
}

/** glyphs (in a frame where text runs left to right) -> text box items; place() maps a frame box to the slide */
function textItems(glyphs, links, k, place, stats) {
  const items = [];
  const lines = buildLines(glyphs);
  const segs = lines.flatMap(segments).filter((s) => s.tokens.length).sort((a, b) => a.y - b.y || a.x0 - b.x0);
  const blocks = [];
  const open = [];
  for (const s of segs) {
    let best = null;
    for (const b of open) {
      if (Math.abs(s.size - b.size) > 0.15 * b.size) continue;
      const gap = s.y - b.last.y;
      if (gap < 0.85 * b.size || gap > 1.8 * b.size) continue;
      if (b.segs.length > 1 && Math.abs(gap - b.pitch) > 0.15 * b.pitch) continue;
      // left edges must really line up; centred/right only when the left edges clearly differ
      const dl = Math.abs(s.x0 - b.x0);
      const fits = {
        l: dl <= 0.25 * s.size,
        ctr: dl > 0.5 * s.size && Math.abs((s.x0 + s.x1) / 2 - (b.x0 + b.x1) / 2) <= 0.3 * s.size,
        r: dl > 0.5 * s.size && Math.abs(s.x1 - b.x1) <= 0.3 * s.size,
      };
      const align = b.align ? (fits[b.align] ? b.align : null) : fits.l ? 'l' : fits.ctr ? 'ctr' : fits.r ? 'r' : null;
      if (!align) continue;
      best = { b, align, gap };
      break;
    }
    if (best) {
      const { b } = best;
      if (b.segs.length === 1) { b.pitch = best.gap; b.align = best.align; }
      b.segs.push(s);
      b.last = s;
      b.x0 = Math.min(b.x0, s.x0);
      b.x1 = Math.max(b.x1, s.x1);
    } else {
      const b = { segs: [s], last: s, x0: s.x0, x1: s.x1, size: s.size, pitch: 0, align: null };
      blocks.push(b);
      open.push(b);
    }
    for (let i = open.length - 1; i >= 0; i--) if (s.y - open[i].last.y > 2.5 * open[i].size) open.splice(i, 1);
  }
  for (const b of blocks) {
    const size = Math.max(...b.segs.map((s) => s.size));
    const pitch = b.segs.length > 1 ? b.pitch : 1.2 * size;
    const lnPct = pitch / (1.2 * size);
    // PowerPoint puts the first baseline at top + pitch - 0.2 x size
    const top = b.segs[0].y - (pitch - 0.2 * size);
    // a little slack so the text never wraps or clips; placed so the alignment edge stays put
    const slack = size * 0.6;
    const shift = b.align === 'ctr' ? slack / 2 : b.align === 'r' ? slack : 0;
    const x0 = b.x0 - shift;
    const paras = b.segs.map((s) => {
      const tabs = [];
      const list = {};
      const runs = runsOf(s, k, links, tabs, x0, (b.align || 'l') === 'l', list);
      const para = { algn: b.align || 'l', lnPct, runs, tabs };
      if (list.textX != null) {
        para.marL = list.textX;
        para.indent = list.markerX - list.textX;
        if (list.bullet) para.bullet = list.bullet;
      }
      return para;
    });
    items.push({ t: 'text', ...place(x0, top, b.x1 - b.x0 + slack, pitch * b.segs.length), paras });
    stats.textBoxes++;
  }
  return items;
}
