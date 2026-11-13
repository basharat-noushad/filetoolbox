// Layout analysis: glyphs/segments/images -> Word structure (paragraphs, lists, headings, tables, images,
// header/footer, margins, spacing). Rule-based; every threshold is in units of font size or points.

const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
function mode(values, step = 0.5) {
  const m = new Map();
  for (const v of values) { const k = Math.round(v / step) * step; m.set(k, (m.get(k) || 0) + 1); }
  let best = null; let bc = -1;
  for (const [k, c] of m) if (c > bc) { best = k; bc = c; }
  return best;
}
const marginTopOf = (tops) => (tops.length ? Math.max(18, Math.min(...tops)) : 72);
const BULLETS = new Set(['•', '▪', '◦', '●', '○', '■', '□', '➢', '✓', '–', '-', '*', '', '', '', '', '', '‣', '⁃']);
const styleKey = (g) => `${g.family}|${g.bold ? 1 : 0}|${g.italic ? 1 : 0}|${Math.round(g.size * 2)}|${g.color}|${g.underline ? 1 : 0}|${g.strike ? 1 : 0}|${g.link || ''}`;

export function analyze({ pages }) {
  const numPages = pages.length;
  // ---- per page: tables, decorations, header/footer split ------------------------------------
  const work = pages.map((p) => {
    const tables = detectTables(p);
    const used = new Set(tables.flatMap((t) => t.segs));
    markDecorations(p, used);
    const tableGlyphs = new Set();
    for (const t of tables) for (const g of p.glyphs) {
      const cx = (g.x0 + g.x1) / 2;
      const cy = g.y - g.size * 0.3;
      if (cx > t.x0 && cx < t.x1 && cy > t.y0 && cy < t.y1) { tableGlyphs.add(g); t.glyphs.push(g); }
    }
    const free = p.glyphs.filter((g) => !tableGlyphs.has(g) && !g.rotated);
    return { p, tables, lines: buildLines(free), freeSegs: p.segs.filter((s) => !used.has(s) && !s.isUnderline) };
  });

  // ---- header / footer: tagged artifacts, or repeated text in the top/bottom bands -------------
  const norm = (s) => s.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const bandCount = new Map();
  for (const w of work) {
    const seen = new Set();
    for (const ln of w.lines) {
      const band = ln.y < w.p.height * 0.1 ? 'H' : ln.y > w.p.height * 0.9 ? 'F' : null;
      if (band) seen.add(band + norm(ln.text));
    }
    for (const k of seen) bandCount.set(k, (bandCount.get(k) || 0) + 1);
  }
  for (const w of work) {
    w.header = []; w.footer = []; w.body = [];
    for (const ln of w.lines) {
      const band = ln.y < w.p.height * 0.1 ? 'H' : ln.y > w.p.height * 0.9 ? 'F' : null;
      const repeated = band && numPages >= 2 && (bandCount.get(band + norm(ln.text)) || 0) >= 2;
      const pageNum = band === 'F' && /^(page\s*)?\d+(\s*(of|\/)\s*\d+)?$/i.test(ln.text.trim());
      const art = ln.glyphs.every((g) => g.artifact) && band;
      if (band && (repeated || pageNum || art)) (band === 'H' ? w.header : w.footer).push(ln);
      else w.body.push(ln);
    }
  }

  // ---- document-level column + typography stats ----------------------------------------------
  // pages read by OCR (extract.js) have approximate positions and sizes: when the document also has real
  // text, they don't set the column, body font, spacing or justification of the other pages, and count for
  // the margins as the picture they replaced (so the other pages come out as they would without OCR)
  const allOcr = pages.every((p) => p.ocr);
  const measured = (pi) => allOcr || !pages[pi].ocr;
  const bodyLines = work.filter((w, pi) => measured(pi)).flatMap((w) => w.body);
  const longLines = bodyLines.filter((l) => l.glyphs.length >= 25);
  const colLeft = mode((longLines.length ? longLines : bodyLines).map((l) => l.x0)) ?? 72;
  const colRight = Math.max(...(longLines.length ? longLines : bodyLines).map((l) => l.x1), colLeft + 100);
  const sizeCount = new Map();
  for (const l of bodyLines) for (const g of l.glyphs) if (!g.space) sizeCount.set(Math.round(g.size * 2) / 2, (sizeCount.get(Math.round(g.size * 2) / 2) || 0) + 1);
  const bodySize = [...sizeCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 11;
  const famCount = new Map();
  for (const l of bodyLines) for (const g of l.glyphs) if (!g.space && Math.abs(g.size - bodySize) < 0.6) famCount.set(g.family, (famCount.get(g.family) || 0) + 1);
  const bodyFamily = [...famCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Calibri';
  const col = { left: colLeft, right: colRight };

  // ---- body blocks per page ------------------------------------------------------------------
  const blocks = [];
  work.forEach((w, pi) => {
    const items = [
      ...w.body.map((l) => ({ kind: 'line', y: l.y, top: l.y - l.asc, line: l })),
      ...w.tables.map((t) => ({ kind: 'table', y: t.y0, top: t.y0, t })),
      ...w.p.images.filter((im) => !im.artifact && im.png && (im.x1 - im.x0) > 4).map((im) => ({ kind: 'image', y: im.y1, top: im.y0, im })),
    ].sort((a, b) => a.top - b.top);
    const pageBlocks = [];
    let cur = null;
    for (const it of items) {
      if (it.kind === 'line') {
        const marker = listMarker(it.line);
        if (!cur || startsNewParagraph(cur, it.line, marker, col)) {
          cur = { type: 'p', lines: [it.line], marker, page: pi };
          pageBlocks.push(cur);
        } else cur.lines.push(it.line);
      } else {
        cur = null;
        if (it.kind === 'table') pageBlocks.push(buildTable(it.t, col));
        else pageBlocks.push({ type: 'image', im: it.im, page: pi, top: it.im.y0, bottom: it.im.y1 });
      }
    }
    attachRules(pageBlocks, w.freeSegs, col);
    pageBlocks.forEach((b, k) => { b.page = pi; b.firstOnPage = k === 0; });
    blocks.push(...pageBlocks);
  });

  // paragraph properties
  const factors = [];
  for (const b of blocks) if (b.type === 'p') { finishParagraph(b, col); if (b.lines.length > 1 && measured(b.page)) factors.push(b.factor); }
  const defaultFactor = mode(factors, 0.05) || 1.15;
  for (const b of blocks) if (b.type === 'p' && b.lines.length === 1) b.factor = b.borderBottom ? 1 : defaultFactor;

  mergeAcrossPages(blocks, col);
  assignHeadings(blocks, bodySize);
  computeSpacing(blocks, defaultFactor, bodySize);

  // Justification flavour: Word 2013+ (compat mode 15) may *shrink* spaces on justified lines, older
  // modes only stretch them. Reproduce whichever the PDF shows, or line breaks will drift.
  const spaceW = new Map();
  for (const p of pages.filter((x, pi) => measured(pi))) for (const g of p.glyphs) if (g.space && g.x1 > g.x0) {
    const k = `${g.family}|${Math.round(g.size * 2)}`;
    if (!spaceW.has(k)) spaceW.set(k, []);
    spaceW.get(k).push(g.x1 - g.x0);
  }
  const spaceMedian = new Map([...spaceW].map(([k, v]) => [k, median(v)])); // once per font, not per gap
  let justified = 0;
  let shrunk = 0;
  for (const b of blocks) if (b.type === 'p' && b.align === 'both' && measured(b.page)) for (const ln of b.lines.slice(0, -1)) {
    justified++;
    const gs = ln.glyphs;
    let minRatio = Infinity;
    for (let i = 1; i < gs.length; i++) {
      const gap = gs[i].x0 - gs[i - 1].x1;
      if (gap < 0.1 * gs[i].size) continue; // inside a word
      const natural = spaceMedian.get(`${gs[i - 1].family}|${Math.round(gs[i - 1].size * 2)}`) || 0.25 * gs[i - 1].size;
      minRatio = Math.min(minRatio, gap / natural);
    }
    if (minRatio < 0.93) shrunk++;
  }
  const compatMode = justified && !shrunk ? 14 : 15;
  if (compatMode === 14) for (const b of blocks) if (b.type === 'table') b.indent += b.pad; // mode 14 measures to the cell text

  // margins
  const tops = [];
  const bottoms = [];
  const byPage = new Map();
  for (const b of blocks) { if (!byPage.has(b.page)) byPage.set(b.page, []); byPage.get(b.page).push(b); }
  for (let wi = 0; wi < work.length; wi++) {
    const pb = byPage.get(wi) || [];
    if (!measured(wi)) { tops.push(pages[wi].ocr.top); bottoms.push(pages[wi].ocr.bottom); continue; }
    if (!pb.length) continue;
    tops.push(Math.min(...pb.map((b) => b.top)));
    bottoms.push(Math.max(...pb.map((b) => b.bottom)));
  }
  const p0 = pages[0];
  const marginTop = tops.length ? Math.max(18, Math.min(...tops)) : 72;
  // pages are forced with explicit breaks, so a bottom margin that is too small is harmless but too large overflows
  const marginBottom = bottoms.length ? Math.max(18, Math.min(marginTopOf(tops), p0.height - Math.max(...bottoms) - 4)) : 72;
  for (const b of blocks) if (b.firstOnPage && b.page > 0) { b.pageBreakBefore = true; b.before = Math.max(0, b.top - marginTop); }
  const first = blocks[0];
  if (first) first.before = Math.max(0, first.top - marginTop);

  // header / footer from the first page that has them
  const hw = work.find((w) => w.header.length);
  const fw = work.find((w) => w.footer.length);
  const hdrParas = hw ? linesToParas(hw.header, col, work.indexOf(hw) + 1, numPages) : [];
  const ftrParas = fw ? linesToParas(fw.footer, col, work.indexOf(fw) + 1, numPages) : [];
  const headerDist = hw ? Math.max(12, Math.min(...hw.header.map((l) => l.y - l.asc))) : 36;
  const footerDist = fw ? Math.max(12, p0.height - Math.max(...fw.footer.map((l) => l.y - l.asc + l.natural))) : 36;

  return {
    page: { width: p0.width, height: p0.height },
    margins: { top: marginTop, bottom: marginBottom, left: colLeft, right: Math.max(18, p0.width - colRight), header: headerDist, footer: footerDist },
    bodyFont: { family: bodyFamily, size: bodySize }, defaultFactor, compatMode, justification: { justified, shrunk },
    header: hdrParas, footer: ftrParas, blocks,
  };
}

// --------------------------------------------------------------------------------- lines --
function buildLines(glyphs) {
  const gs = [...glyphs].sort((a, b) => a.y - b.y || a.x0 - b.x0);
  const lines = [];
  for (const g of gs) {
    let ln = null;
    for (let k = lines.length - 1; k >= Math.max(0, lines.length - 4); k--) {
      if (Math.abs(lines[k].y0 - g.y) <= 0.45 * Math.max(lines[k].size, g.size)) { ln = lines[k]; break; }
    }
    if (!ln) { ln = { y0: g.y, size: g.size, glyphs: [] }; lines.push(ln); }
    ln.glyphs.push(g);
    ln.size = Math.max(ln.size, g.size);
  }
  return lines.map(finishLine).filter((l) => l.text.trim()).sort((a, b) => a.y - b.y);
}

function finishLine(L) {
  const gs = L.glyphs.sort((a, b) => a.x0 - b.x0);
  const dedup = [];
  for (const g of gs) {
    const d = dedup[dedup.length - 1];
    if (d && d.ch === g.ch && Math.abs(d.x0 - g.x0) < 0.3 && Math.abs(d.y - g.y) < 0.3) { d.bold = true; continue; } // overprint = fake bold
    dedup.push(g);
  }
  const solid = dedup.filter((g) => !g.space);
  L.y = mode(solid.map((g) => g.y), 0.25) ?? L.y0;
  L.size = Math.max(...solid.map((g) => g.size), 1);
  L.tokens = [];
  let prev = null;
  for (const g of dedup) {
    if (g.space) { if (prev && !prev.space) { L.tokens.push({ ...prev, ch: ' ', space: true, virtual: true }); prev = L.tokens[L.tokens.length - 1]; } continue; }
    if (prev && !prev.space && g.x0 - prev.x1 > 0.15 * g.size) L.tokens.push({ ...prev, ch: ' ', space: true, virtual: true, underline: prev.underline && g.underline });
    L.tokens.push(g);
    prev = g;
  }
  while (L.tokens.length && L.tokens[L.tokens.length - 1].space) L.tokens.pop();
  L.glyphs = solid;
  L.x0 = solid.length ? solid[0].x0 : 0;
  L.x1 = solid.length ? solid[solid.length - 1].x1 : 0;
  L.asc = Math.max(...solid.map((g) => g.ascent * g.size), 1);
  L.desc = Math.max(...solid.map((g) => -g.descent * g.size), 0);
  L.natural = Math.max(...solid.map((g) => (g.ascent - g.descent) * g.size), 1);
  L.text = L.tokens.map((t) => t.ch).join('');
  if (!solid.length) { L.text = ''; return L; } // only spaces left (e.g. after rotated text was set aside)
  const sk = new Map();
  for (const g of solid) sk.set(styleKey(g), (sk.get(styleKey(g)) || 0) + 1);
  const dom = [...sk.entries()].sort((a, b) => b[1] - a[1])[0][0].split('|');
  L.dom = { family: dom[0], bold: dom[1] === '1', size: Number(dom[3]) / 2, color: dom[4] };
  L.allBold = solid.every((g) => g.bold || BULLETS.has(g.ch));
  return L;
}

// ----------------------------------------------------------------------------- tables --
function detectTables(p) {
  const H = p.segs.filter((s) => Math.abs(s.y1 - s.y0) < 0.6 && s.x1 - s.x0 > 3);
  const V = p.segs.filter((s) => Math.abs(s.x1 - s.x0) < 0.6 && s.y1 - s.y0 > 3);
  const tol = 1.6;
  const parent = new Map();
  const find = (x) => { while (parent.get(x) !== x) x = parent.get(x); return x; };
  const union = (a, b) => parent.set(find(a), find(b));
  for (const s of [...H, ...V]) parent.set(s, s);
  for (const h of H) for (const v of V) {
    if (v.x0 >= h.x0 - tol && v.x0 <= h.x1 + tol && h.y0 >= v.y0 - tol && h.y0 <= v.y1 + tol) union(h, v);
  }
  const groups = new Map();
  for (const s of [...H, ...V]) { const r = find(s); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(s); }
  const tables = [];
  for (const segs of groups.values()) {
    const hs = segs.filter((s) => H.includes(s));
    const vs = segs.filter((s) => V.includes(s));
    const cluster = (vals) => { const out = []; for (const v of [...vals].sort((a, b) => a - b)) if (!out.length || v - out[out.length - 1] > 1.5) out.push(v); return out; };
    const ys = cluster(hs.map((s) => s.y0));
    const xs = cluster(vs.map((s) => s.x0));
    if (ys.length < 2 || xs.length < 2) continue;
    tables.push({ x0: xs[0], x1: xs[xs.length - 1], y0: ys[0], y1: ys[ys.length - 1], xs, ys, hs, vs, segs, glyphs: [], rects: p.rects });
  }
  return tables;
}

function markDecorations(p, used) {
  for (const s of p.segs) {
    if (used.has(s) || Math.abs(s.y1 - s.y0) > 0.6 || s.w > 2) continue;
    let hit = false;
    for (const g of p.glyphs) {
      if (g.space) continue;
      const ov = Math.min(s.x1, g.x1) - Math.max(s.x0, g.x0);
      if (ov < (g.x1 - g.x0) * 0.5) continue;
      const d = s.y0 - g.y;
      if (d >= -0.05 * g.size && d <= 0.3 * g.size) { g.underline = true; hit = true; }
      else if (-d >= 0.15 * g.size && -d <= 0.45 * g.size) { g.strike = true; hit = true; }
    }
    if (hit) s.isUnderline = true;
  }
  for (const l of p.links) for (const g of p.glyphs) {
    const cx = (g.x0 + g.x1) / 2;
    if (cx >= l.x0 && cx <= l.x1 && g.y >= l.y0 && g.y - g.size * 0.3 <= l.y1) g.link = l.url;
  }
}

function buildTable(t, col) {
  const R = t.ys.length - 1;
  const C = t.xs.length - 1;
  const coversV = (x, ya, yb) => t.vs.some((v) => Math.abs(v.x0 - x) < 1.2 && v.y0 <= ya + 1 && v.y1 >= yb - 1);
  const coversH = (y, xa, xb) => t.hs.some((h) => Math.abs(h.y0 - y) < 1.2 && h.x0 <= xa + 1 && h.x1 >= xb - 1);
  const segFor = (list, pred) => list.find(pred);
  const rows = [];
  const cellLines = (x0, x1, y0, y1) => buildLines(t.glyphs.filter((g) => {
    const cx = (g.x0 + g.x1) / 2;
    const cy = g.y - g.size * 0.3;
    return cx > x0 && cx < x1 && cy > y0 && cy < y1;
  }));
  for (let r = 0; r < R; r++) {
    const ya = t.ys[r];
    const yb = t.ys[r + 1];
    const cells = [];
    for (let c = 0; c < C;) {
      let span = 1;
      while (c + span < C && !coversV(t.xs[c + span], ya, yb)) span++;
      const xa = t.xs[c];
      const xb = t.xs[c + span];
      const vMerge = r > 0 && !coversH(ya, xa, xb) ? 'continue' : (r < R - 1 && !coversH(yb, xa, xb) ? 'restart' : null);
      const fillRect = t.rects.find((q) => q.x0 <= xa + 2 && q.x1 >= xb - 2 && q.y0 <= ya + 2 && q.y1 >= yb - 2 && q.color && q.color.toLowerCase() !== '#ffffff');
      const side = (pred, list) => { const s = segFor(list, pred); return s ? { w: Math.max(0.25, s.w), color: s.color } : null; };
      const borders = {
        top: side((h) => Math.abs(h.y0 - ya) < 1.2 && h.x0 <= xa + 1 && h.x1 >= xb - 1, t.hs),
        bottom: side((h) => Math.abs(h.y0 - yb) < 1.2 && h.x0 <= xa + 1 && h.x1 >= xb - 1, t.hs),
        left: side((v) => Math.abs(v.x0 - xa) < 1.2 && v.y0 <= ya + 1 && v.y1 >= yb - 1, t.vs),
        right: side((v) => Math.abs(v.x0 - xb) < 1.2 && v.y0 <= ya + 1 && v.y1 >= yb - 1, t.vs),
      };
      const lines = vMerge === 'continue' ? [] : cellLines(xa, xb, ya, vMerge === 'restart' ? t.ys[R] : yb);
      const inner = { left: xa, right: xb };
      const paras = [];
      let cur = null;
      for (const ln of lines) {
        const mk = listMarker(ln);
        if (!cur || startsNewParagraph(cur, ln, mk, inner)) { cur = { type: 'p', lines: [ln], marker: mk }; paras.push(cur); }
        else cur.lines.push(ln);
      }
      for (const pa of paras) finishParagraph(pa, inner, true);
      cells.push({ col: c, span, vMerge, fill: fillRect ? fillRect.color : null, borders, paras, x0: xa, x1: xb });
      c += span;
    }
    rows.push({ height: yb - ya, cells });
  }
  // cell padding & alignment from the text positions
  // the smallest text inset on either side is the cell padding (left-aligned cells on the left, right-aligned on the right)
  const insets = [];
  for (const row of rows) for (const cell of row.cells) for (const pa of cell.paras) {
    insets.push(Math.min(...pa.lines.map((l) => l.x0)) - cell.x0, cell.x1 - Math.max(...pa.lines.map((l) => l.x1)));
  }
  const pad = insets.length ? Math.max(0, Math.min(14, Math.min(...insets))) : 5.4;
  for (const row of rows) for (const cell of row.cells) for (const pa of cell.paras) {
    const l = pa.lines[0];
    const leftGap = l.x0 - cell.x0;
    const rightGap = cell.x1 - Math.max(...pa.lines.map((x) => x.x1));
    if (Math.abs(rightGap - pad) < 1.5 && leftGap > pad + 3) pa.align = 'right';
    else if (Math.abs(leftGap - rightGap) < 2 && leftGap > pad + 3) pa.align = 'center';
    else pa.align = 'left';
    pa.indLeft = pa.align === 'left' ? Math.max(0, leftGap - pad) : 0;
    pa.firstLine = 0;
    // single-line cells: choose spacing so one line fills the row like the original
    if (pa.lines.length === 1 && cell.paras.length === 1) {
      const innerH = row.height - (cell.borders.top ? cell.borders.top.w : 0);
      pa.factor = Math.max(1, Math.round((innerH / l.natural) * 100) / 100);
    }
    pa.before = 0;
  }
  return {
    type: 'table', x0: t.x0, x1: t.x1, top: t.y0, bottom: t.y1, rows, pad,
    colWidths: t.xs.slice(1).map((x, i) => x - t.xs[i]), indent: t.x0 - col.left,
  };
}

// --------------------------------------------------------------------- paragraphs --
function listMarker(ln) {
  const t = ln.tokens.filter((x) => !x.virtual || x.ch !== ' ');
  const solid = ln.glyphs;
  if (!solid.length) return null;
  const g0 = solid[0];
  if (BULLETS.has(g0.ch) && solid[1] && solid[1].x0 - g0.x1 > 0.25 * g0.size) {
    return { kind: 'bullet', labelX: g0.x0, textX: solid[1].x0, count: 1 };
  }
  let i = 0;
  let label = '';
  while (i < solid.length && i < 6 && !(i > 0 && solid[i].x0 - solid[i - 1].x1 > 0.15 * solid[i].size)) { label += solid[i].ch; i++; }
  const m = /^\(?(\d{1,3}|[a-zA-Z]|[ivxlIVXL]{1,4})[.)]$/.exec(label);
  if (m && solid[i] && solid[i].x0 - solid[i - 1].x1 > 0.5 * g0.size) {
    const v = m[1];
    let fmt = 'decimal';
    let num = parseInt(v, 10);
    if (Number.isNaN(num)) {
      if (/^[ivxl]+$/.test(v) && v.length > 1) { fmt = 'lowerRoman'; num = 1; }
      else if (/^[IVXL]+$/.test(v) && v.length > 1) { fmt = 'upperRoman'; num = 1; }
      else if (/^[a-z]$/.test(v)) { fmt = 'lowerLetter'; num = v.charCodeAt(0) - 96; }
      else { fmt = 'upperLetter'; num = v.charCodeAt(0) - 64; }
    }
    return { kind: 'number', fmt, num, suffix: label.slice(-1), labelX: g0.x0, textX: solid[i].x0, count: i };
  }
  void t;
  return null;
}

function startsNewParagraph(cur, ln, marker, col) {
  if (marker) return true;
  const prev = cur.lines[cur.lines.length - 1];
  const pitch = ln.y - prev.y;
  const est = cur.lines.length >= 2 ? cur.lines[cur.lines.length - 1].y - cur.lines[cur.lines.length - 2].y : prev.natural * 1.2;
  if (pitch > est * 1.18 + 1) return true;
  if (Math.abs(ln.size - prev.size) > 0.6) return true;
  if (ln.dom.family !== prev.dom.family || ln.allBold !== prev.allBold || ln.dom.color !== prev.dom.color) return true;
  const contX = cur.lines.length >= 2 ? cur.lines[1].x0 : (cur.marker ? cur.marker.textX : null);
  if (contX != null && Math.abs(ln.x0 - contX) > 2) return true;
  // previous line stopped short although the next line's first word would have fitted -> deliberate break
  const firstWord = ln.tokens.findIndex((t) => t.space);
  const fwEnd = firstWord > 0 ? ln.tokens[firstWord - 1].x1 : ln.x1;
  const fwWidth = fwEnd - ln.x0;
  const centered = Math.abs((prev.x0 + prev.x1) / 2 - (col.left + col.right) / 2) < 3 && prev.x0 > col.left + 10;
  if (!centered && col.right - prev.x1 > fwWidth + prev.size * 0.35) return true;
  return false;
}

function finishParagraph(b, col, inCell = false) {
  const L = b.lines;
  const first = L[0];
  const last = L[L.length - 1];
  b.top = first.y - first.asc;
  b.bottom = last.y - last.asc + last.natural;
  const contX = L.length >= 2 ? L[1].x0 : first.x0;
  if (b.marker) {
    b.indLeft = b.marker.textX - col.left;
    b.firstLine = -(b.marker.textX - b.marker.labelX);
  } else {
    b.indLeft = Math.max(0, contX - col.left);
    b.firstLine = first.x0 - contX;
  }
  const full = (l) => Math.abs(l.x1 - col.right) < 2.5;
  const center = (l) => Math.abs((l.x0 + l.x1) / 2 - (col.left + col.right) / 2) < 3 && l.x0 > col.left + 8;
  if (L.length >= 2 && L.slice(0, -1).every(full)) b.align = 'both';
  else if (L.every(center)) b.align = 'center';
  else if (L.every((l) => full(l) && l.x0 > col.left + (col.right - col.left) * 0.25)) b.align = 'right';
  else b.align = 'left';
  if (b.align === 'center' || b.align === 'right') { b.indLeft = 0; b.firstLine = 0; }
  if (L.length >= 2) {
    const pitch = median(L.slice(1).map((l, i) => l.y - L[i].y));
    b.factor = Math.round((pitch / first.natural) * 100) / 100;
  } else b.factor = b.factor || null;
  b.runs = makeRuns(L, b.marker);
  b.size = first.size;
  b.natural = first.natural;
  b.asc = first.asc;
  b.allBold = L.every((l) => l.allBold);
  b.inCell = inCell;
}

function makeRuns(lines, marker) {
  const runs = [];
  let cur = null;
  const push = (g, ch) => {
    const k = styleKey(g);
    if (cur && cur.key === k) cur.text += ch;
    else {
      cur = { key: k, text: ch, family: g.family, bold: !!g.bold, italic: !!g.italic, size: g.size, color: g.color, underline: !!g.underline, strike: !!g.strike, link: g.link || null };
      runs.push(cur);
    }
  };
  lines.forEach((ln, li) => {
    let toks = ln.tokens;
    if (li === 0 && marker) toks = toks.filter((t) => t.x0 >= marker.textX - 0.5);
    while (toks.length && toks[0].space) toks = toks.slice(1);
    if (li > 0 && cur) {
      const endCh = cur.text[cur.text.length - 1];
      if (!(endCh === '-' || endCh === '­') && endCh !== ' ') cur.text += ' ';
    }
    for (const t of toks) {
      if (t.space) { if (cur) cur.text += ' '; continue; }
      push(t, BULLETS.has(t.ch) && t.ch >= '' ? '•' : t.ch);
    }
  });
  for (const r of runs) r.text = r.text.replace(/­/g, '');
  // letter-spacing: consistent extra advance between glyphs inside words
  const extras = new Map();
  for (const ln of lines) {
    const gs = ln.glyphs;
    for (let i = 1; i < gs.length; i++) {
      const gap = gs[i].x0 - gs[i - 1].x1;
      if (gap > 0.1 * gs[i].size || styleKey(gs[i]) !== styleKey(gs[i - 1])) continue;
      const k = styleKey(gs[i]);
      if (!extras.has(k)) extras.set(k, []);
      extras.get(k).push(gap);
    }
  }
  for (const r of runs) {
    const e = extras.get(r.key);
    if (e && e.length >= 4) { const m = median(e); if (Math.abs(m) > 0.08) r.charSpacing = m; }
  }
  return runs;
}

function linesToParas(lines, col, pageNo, numPages) {
  const paras = [];
  for (const ln of lines.sort((a, b) => a.y - b.y)) {
    const p = { type: 'p', lines: [ln], marker: null };
    finishParagraph(p, col);
    // page numbers -> fields
    for (const r of p.runs) {
      r.parts = [];
      const re = /\d+/g;
      let last = 0;
      let m;
      while ((m = re.exec(r.text))) {
        const n = Number(m[0]);
        const field = n === pageNo ? 'PAGE' : n === numPages && numPages > 1 ? 'NUMPAGES' : null;
        if (!field) continue;
        if (m.index > last) r.parts.push(r.text.slice(last, m.index));
        r.parts.push({ field });
        last = m.index + m[0].length;
      }
      if (last < r.text.length) r.parts.push(r.text.slice(last));
    }
    p.before = 0;
    p.factor = 1;
    paras.push(p);
  }
  return paras;
}

function attachRules(blocks, segs, col) {
  for (const s of segs) {
    if (Math.abs(s.y1 - s.y0) > 0.6 || s.x1 - s.x0 < (col.right - col.left) * 0.6) continue;
    const prev = blocks.filter((b) => b.type === 'p' && b.lines[b.lines.length - 1].y < s.y0).pop();
    if (!prev) continue;
    const last = prev.lines[prev.lines.length - 1];
    if (s.y0 - last.y > 2.5 * last.size) continue;
    prev.borderBottom = { w: Math.max(0.25, s.w), color: s.color, y: s.y0 };
  }
}

function mergeAcrossPages(blocks, col) {
  for (let i = 1; i < blocks.length; i++) {
    const a = blocks[i - 1];
    const b = blocks[i];
    if (!b.firstOnPage || a.type !== 'p' || b.type !== 'p' || b.marker || a.page === b.page) continue;
    const lastA = a.lines[a.lines.length - 1];
    const fullLine = Math.abs(lastA.x1 - col.right) < 2.5;
    if (fullLine && !/[.!?:]$/.test(lastA.text.trim()) && Math.abs(b.lines[0].x0 - (col.left + a.indLeft)) < 2 &&
      Math.abs(b.size - a.size) < 0.5 && b.lines[0].dom.family === lastA.dom.family) {
      a.lines.push(...b.lines);
      finishParagraph(a, col);
      a.bottom = b.bottom;
      a.continuesTo = b.page;
      blocks.splice(i, 1);
      i--;
    }
  }
}

function assignHeadings(blocks, bodySize) {
  const cands = blocks.filter((b) => b.type === 'p' && !b.marker && b.lines.length <= 2 && b.size >= bodySize * 1.15);
  const sizes = [...new Set(cands.map((b) => Math.round(b.size * 2) / 2))].sort((a, b) => b - a);
  let lvl = 1;
  const map = new Map();
  for (const s of sizes) {
    const withSize = cands.filter((b) => Math.round(b.size * 2) / 2 === s);
    if (lvl === 1 && withSize.length === 1 && s >= bodySize * 1.8 && withSize[0].page === 0 && !map.size) map.set(s, 'title');
    else if (lvl <= 3) map.set(s, lvl++);
  }
  for (const b of cands) b.heading = map.get(Math.round(b.size * 2) / 2) || null;
}

// space before each block, reproducing the original baseline distances under Word's
// "max(spaceAfter, spaceBefore)" rule (we put everything in spaceBefore, spaceAfter = 0)
function computeSpacing(blocks, defaultFactor, bodySize) {
  let prev = null;
  for (const b of blocks) {
    if (b.type === 'p') b.factor = b.factor || defaultFactor;
    if (!prev || b.page !== prev.page) { b.before = 0; prev = b; continue; }
    const prevBottom = prev.type === 'p'
      ? prev.lines[prev.lines.length - 1].y - prev.lines[prev.lines.length - 1].asc + prev.lines[prev.lines.length - 1].natural * prev.factor +
        (prev.borderBottom ? Math.max(0, prev.borderBottom.y - (prev.lines[prev.lines.length - 1].y - prev.lines[prev.lines.length - 1].asc + prev.lines[prev.lines.length - 1].natural * prev.factor)) + prev.borderBottom.w : 0)
      : prev.bottom; // image paragraphs are written with single spacing, so they end at the image's bottom edge
    b.before = Math.max(0, b.top - prevBottom);
    if (prev.borderBottom && prev.type === 'p') {
      const lineBottom = prev.lines[prev.lines.length - 1].y - prev.lines[prev.lines.length - 1].asc + prev.lines[prev.lines.length - 1].natural * prev.factor;
      prev.borderBottom.space = Math.max(0, prev.borderBottom.y - lineBottom - prev.borderBottom.w / 2);
    }
    prev = b;
  }
}

// shared with PDF -> Excel / PowerPoint
export { buildLines, detectTables, markDecorations, buildTable };
