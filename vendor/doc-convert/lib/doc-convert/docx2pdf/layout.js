// Line breaking, tables and pagination -> absolute display lists per page (points, y down).

export function layoutDocument(model, fonts) {
  const sec = model.section;
  const colW = sec.width - sec.left - sec.right;
  const L = new Layouter(fonts, model.defTab, model.compat);
  const env = { field: () => '1' };
  const measured = model.blocks.map((b) => L.measure(b, colW, env));
  const pages = L.paginate(measured, sec);
  const total = pages.length;
  pages.forEach((page, idx) => {
    const n = idx + 1;
    const envP = { field: (code) => String(code === 'PAGE' ? n : total) };
    const pick = (bag) => (n === 1 && sec.titlePg ? bag.first : bag.default);
    const hdr = pick(sec.headers);
    const ftr = pick(sec.footers);
    if (hdr) L.emitFlow(page.items, L.flow(hdr, colW, envP), sec.left, sec.header);
    if (ftr) {
      const f = L.flow(ftr, colW, envP);
      L.emitFlow(page.items, f, sec.left, sec.height - sec.footer - f.height);
    }
  });
  return { pages, width: sec.width, height: sec.height };
}

class Layouter {
  constructor(fonts, defTab, compat) {
    this.fonts = fonts;
    this.defTab = defTab || 36;
    this.compat = compat || { mode: 15, sumSpacing: false };
  }

  // Word: the gap between paragraphs is max(after, before) unless doNotUseHTMLParagraphAutoSpacing is set.
  spacingGap(prev, m) {
    let before = m.before;
    let after = prev ? prev.after : 0;
    if (prev && m.contextual && prev.styleId === m.styleId) before = 0;
    if (prev && prev.contextual && prev.styleId === m.styleId) after = 0;
    return this.compat.sumSpacing ? before + after : Math.max(before, after);
  }

  measure(b, width, env) {
    if (b.kind === 'p') return this.para(b, width, env);
    if (b.kind === 'tbl') return this.table(b, width, env);
    return b;
  }

  piece(text, rp, kind, link) {
    let rec = this.fonts.get(rp);
    if (kind !== 'tab' && !this.fonts.covers(rec, text)) rec = this.fonts.fallback(rp) || rec;
    let size = rp.size;
    let rise = 0;
    if (rp.vertAlign === 'superscript') { size = rp.size * 0.65; rise = rp.size * 0.35; }
    else if (rp.vertAlign === 'subscript') { size = rp.size * 0.65; rise = -rp.size * 0.14; }
    const w = kind === 'tab' ? 0 : this.fonts.width(rec, size, text, rp.charSpacing);
    return { kind, text, rp, rec, size, rise, w, asc: rec.asc * rp.size, desc: rec.desc * rp.size, link };
  }

  nextTab(x, P, left) {
    // a hanging indent acts as a stop, and wins over custom stops beyond it (Word)
    const hang = P.firstLine < 0 && x < left - 0.5 ? { pos: left, val: 'left' } : null;
    for (const t of P.tabs) if (t.pos > x + 0.5 && t.val !== 'bar') return hang && hang.pos < t.pos ? hang : t;
    if (hang) return hang;
    return { pos: (Math.floor(x / this.defTab + 1e-6) + 1) * this.defTab, val: 'left' };
  }

  para(block, width, env) {
    const { P, markRp, label } = block;
    const pieces = [];
    for (const it of block.items) {
      if (it.t === 'text') {
        const s = it.rp.caps ? it.text.toUpperCase() : it.text;
        for (const part of s.split(/( +)/)) {
          if (!part) continue;
          if (/^ +$/.test(part)) { pieces.push(this.piece(part, it.rp, 'space', it.link)); continue; }
          // line-break opportunity after a hyphen inside a word ("no-|show"), as Word does
          const segs = part.split(/(?<=[\p{L}\p{N}][-‐–—])(?=[\p{L}\p{N}])/u);
          segs.forEach((seg, i) => {
            const pc = this.piece(seg, it.rp, 'word', it.link);
            if (i < segs.length - 1) pc.breakAfter = true;
            pieces.push(pc);
          });
        }
      } else if (it.t === 'tab') pieces.push(this.piece(' ', it.rp, 'tab'));
      else if (it.t === 'br') pieces.push({ kind: 'br' });
      else if (it.t === 'img') pieces.push({ kind: 'img', w: it.w, h: it.h, asc: it.h, desc: 0, img: it });
      else if (it.t === 'field') pieces.push(this.piece(env.field(it.code), it.rp, 'word'));
    }
    const left = P.indLeft;
    const right = width - P.indRight;
    let firstStart = left + P.firstLine;
    let lab = null;
    if (label) {
      const lp = this.piece(label.text, label.rp, 'word');
      const lx = left + P.firstLine;
      const end = lx + lp.w;
      if (label.suff === 'space') firstStart = end + this.fonts.width(lp.rec, lp.size, ' ');
      else if (label.suff === 'nothing') firstStart = end;
      else firstStart = P.firstLine < 0 && end <= left + 0.01 ? left : this.nextTab(end, P, left).pos;
      lab = { piece: lp, x: lx };
    }

    const lines = [];
    const newLine = (start) => ({ start, x: start, items: [], pend: [], has: false, br: false });
    let ln = newLine(firstStart);
    const commit = () => {
      for (const s of ln.pend) { ln.items.push({ p: s, x: ln.x, w: s.w }); ln.x += s.w; }
      ln.pend = [];
    };
    const finish = (br) => { ln.pend = []; ln.br = br; lines.push(ln); ln = newLine(left); };
    for (let k = 0; k < pieces.length;) {
      const p = pieces[k];
      if (p.kind === 'br') { finish(true); k++; continue; }
      if (p.kind === 'space') { ln.pend.push(p); k++; continue; }
      if (p.kind === 'tab') {
        commit();
        const stop = this.nextTab(ln.x, P, left);
        let seg = 0;
        for (let q = k + 1; q < pieces.length && pieces[q].kind !== 'tab' && pieces[q].kind !== 'br'; q++) seg += pieces[q].w;
        let target = stop.pos;
        if (stop.val === 'right' || stop.val === 'end') target -= seg;
        else if (stop.val === 'center') target -= seg / 2;
        const w = Math.max(0, Math.min(target, right) - ln.x);
        ln.items.push({ p, x: ln.x, w });
        ln.x += w;
        ln.has = true;
        k++;
        continue;
      }
      let j = k;
      let gw = 0;
      while (j < pieces.length && (pieces[j].kind === 'word' || pieces[j].kind === 'img')) {
        gw += pieces[j].w;
        j++;
        if (pieces[j - 1].breakAfter) break;
      }
      const pendW = ln.pend.reduce((a, s) => a + s.w, 0);
      if (ln.has && ln.x + pendW + gw > right + 0.01) finish(false);
      else commit();
      for (let q = k; q < j; q++) {
        ln.items.push({ p: pieces[q], x: ln.x, w: pieces[q].w });
        ln.x += pieces[q].w;
        ln.has = true;
      }
      k = j;
    }
    finish(true);

    const mark = this.piece('x', markRp, 'word');
    lines.forEach((l, idx) => {
      let end = l.start;
      for (const it of l.items) if (it.p.kind !== 'space') end = Math.max(end, it.x + it.w);
      const free = right - end;
      if (P.jc === 'center' || P.jc === 'right') {
        const shift = P.jc === 'center' ? free / 2 : free;
        for (const it of l.items) it.x += shift;
      } else if (P.jc === 'both' && !l.br && free > 0) {
        const gaps = l.items.filter((it) => it.p.kind === 'space' && it.x + it.w <= end + 0.01 && it.x > l.start);
        if (gaps.length) {
          const add = free / gaps.length;
          let shift = 0;
          for (const it of l.items) {
            it.x += shift;
            if (gaps.includes(it)) { it.w += add; shift += add; }
          }
        }
      }
      // text and inline objects are measured separately: proportional spacing scales text only
      let asc = 0;
      let desc = 0;
      let objH = 0;
      for (const it of l.items) {
        if (it.p.kind === 'img') objH = Math.max(objH, it.p.h);
        else { asc = Math.max(asc, it.p.asc || 0); desc = Math.max(desc, it.p.desc || 0); }
      }
      if (asc === 0) { asc = mark.asc; desc = Math.max(desc, mark.desc); }
      const natural = asc + desc;
      if (P.lineRule === 'exact') { l.h = P.line / 20; l.base = Math.max(0, l.h - desc); }
      else if (P.lineRule === 'atLeast') {
        const nat = Math.max(natural, objH + desc);
        l.h = Math.max(nat, P.line / 20);
        l.base = Math.max(asc, objH) + (l.h - nat);
      } else {
        l.h = Math.max(natural * (P.line / 240), objH + desc);
        l.base = Math.max(asc, objH);
      }
    });
    return {
      kind: 'p', lines, label: lab, before: P.before, after: P.after, contextual: P.contextual,
      styleId: P.styleId, keepNext: P.keepNext, keepLines: P.keepLines, pageBreakBefore: P.pageBreakBefore,
      borders: P.borders, shading: P.shading, left, right,
    };
  }

  table(tb, width, env) {
    const { T, grid, rows } = tb;
    const nCols = rows.reduce((m, r) => Math.max(m, r.cells.reduce((a, c) => Math.max(a, c.col + c.span), 0)), grid.length); // no spread: tables can have 100k+ rows
    let cols = grid.slice();
    if (cols.length < nCols || cols.reduce((a, b) => a + b, 0) < 1) cols = Array(nCols).fill(width / nCols);
    const total = cols.reduce((a, b) => a + b, 0);
    // Word 2010 (compat < 15) positions the first cell's *text* at the indent, so the border hangs out.
    let x0 = T.indent - (this.compat.mode < 15 ? T.margins.left : 0);
    if (T.jc === 'center') x0 = (width - total) / 2;
    else if (T.jc === 'right' || T.jc === 'end') x0 = width - total;
    const colX = [x0];
    for (const w of cols) colX.push(colX[colX.length - 1] + w);
    const TB = T.borders;
    const out = rows.map((row, ri) => {
      const last = ri === rows.length - 1;
      const cells = row.cells.map((c) => {
        const x = colX[c.col];
        const w = colX[Math.min(c.col + c.span, cols.length)] - x;
        const inner = Math.max(1, w - c.margins.left - c.margins.right);
        const flow = c.vMerge === 'continue' ? { height: 0, entries: [] } : this.flow(c.blocks, inner, env);
        const b = c.borders;
        const pick = (side, edge, innerSide) => (b[side] !== undefined ? b[side] : edge ? TB[side] : TB[innerSide]);
        return {
          c, x, w, flow, h: c.margins.top + flow.height + c.margins.bottom,
          bt: pick('top', ri === 0, 'insideH'), bb: pick('bottom', last, 'insideH'),
          bl: pick('left', c.col === 0, 'insideV'), br: pick('right', c.col + c.span >= cols.length, 'insideV'),
        };
      });
      // horizontal border widths take up row height (top border of each row, plus the bottom one at the end)
      const topW = Math.max(0, ...cells.map((k) => (k.bt ? k.bt.width : 0)));
      const botW = last ? Math.max(0, ...cells.map((k) => (k.bb ? k.bb.width : 0))) : 0;
      let h = Math.max(0, ...cells.map((k) => k.h)) + topW + botW;
      if (row.hRule === 'exact' && row.height) h = row.height;
      else if (row.height) h = Math.max(h, row.height);
      return { cells, h, topW, botW, index: ri, last };
    });
    out.forEach((r, i) => {
      const next = out[i + 1];
      r.continuedCols = new Set(next ? next.cells.filter((k) => k.c.vMerge === 'continue').map((k) => k.c.col) : []);
    });
    return { kind: 'tbl', T, rows: out, nCols: cols.length };
  }

  // Lay out blocks without pagination (table cells, headers, footers).
  flow(blocks, width, env) {
    const entries = [];
    let y = 0;
    let prev = null;
    for (const b of blocks) {
      const m = this.measure(b, width, env);
      if (m.kind === 'p') {
        y += this.spacingGap(prev, m);
        m.lines.forEach((ln, i) => { entries.push({ kind: 'line', y, para: m, line: ln, first: i === 0 }); y += ln.h; });
        y = this.paraBorder(entries, m, y);
        prev = m;
      } else if (m.kind === 'tbl') {
        y += prev ? prev.after : 0;
        for (const row of m.rows) { entries.push({ kind: 'row', y, tbl: m, row }); y += row.h; }
        prev = { after: 0, styleId: '__tbl__' };
      }
    }
    if (prev) y += prev.after;
    return { height: y, entries };
  }

  paraBorder(entries, m, y) {
    const b = m.borders.bottom;
    if (!b) return y;
    y += b.space;
    entries.push({ kind: 'hline', y: y + b.width / 2, x1: m.left, x2: m.right, w: b.width, color: b.color });
    return y + b.width;
  }

  emitFlow(items, flow, x, y) {
    for (const e of flow.entries) {
      if (e.kind === 'line') this.emitLine(items, e.para, e.line, x, y + e.y, e.first);
      else if (e.kind === 'row') this.emitRow(items, e.tbl, e.row, x, y + e.y);
      else if (e.kind === 'hline') items.push({ t: 'line', x1: x + e.x1, x2: x + e.x2, y1: y + e.y, y2: y + e.y, w: e.w, color: e.color });
    }
  }

  emitLine(items, para, ln, x, top, first) {
    const base = top + ln.base;
    if (first && para.label) {
      const lp = para.label.piece;
      items.push({ t: 'text', x: x + para.label.x, y: base, text: lp.text, rec: lp.rec, size: lp.size, color: lp.rp.color || '#000000', cs: 0, w: lp.w });
    }
    let cur = null;
    const addLine = (x1, x2, y, w, color) => {
      const last = items[items.length - 1];
      if (last && last.t === 'line' && last.y1 === y && last.w === w && last.color === color && Math.abs(last.x2 - x1) < 0.05) last.x2 = x2;
      else items.push({ t: 'line', x1, x2, y1: y, y2: y, w, color });
    };
    for (const it of ln.items) {
      const p = it.p;
      const px = x + it.x;
      if (p.kind === 'img') {
        items.push({ t: 'img', x: px, y: base - p.h, w: p.w, h: p.h, data: p.img.data, format: p.img.format });
        cur = null;
        continue;
      }
      const color = p.rp.color || '#000000';
      if (p.rp.highlight) items.push({ t: 'rect', x: px, y: base - p.asc, w: it.w, h: p.asc + p.desc, fill: p.rp.highlight });
      const contiguous = cur && cur.rec === p.rec && cur.size === p.size && cur.color === color && cur.rise === p.rise &&
        cur.cs === p.rp.charSpacing && cur.link === p.link && Math.abs(cur.x + cur.w - px) < 0.01;
      if (p.kind === 'word') {
        if (contiguous) { cur.text += p.text; cur.w += it.w; }
        else {
          cur = { t: 'text', x: px, y: base - p.rise, text: p.text, rec: p.rec, size: p.size, color, rise: p.rise, cs: p.rp.charSpacing, w: it.w, link: p.link };
          items.push(cur);
        }
      } else if (p.kind === 'space') {
        if (contiguous && Math.abs(it.w - p.w) < 0.01) { cur.text += p.text; cur.w += it.w; }
        else cur = null;
      } else cur = null; // tab
      if (p.rp.underline || p.rp.strike) {
        const th = Math.max(0.4, p.rec.ulThick * p.size);
        if (p.rp.underline) addLine(px, px + it.w, base + p.rec.ulPos * p.size + th / 2, th, color);
        if (p.rp.strike) addLine(px, px + it.w, base - p.size * 0.27, th, color);
      }
    }
  }

  emitRow(items, tbl, row, x, top) {
    for (const k of row.cells) {
      const c = k.c;
      const cx = x + k.x;
      if (c.fill) items.push({ t: 'rect', x: cx, y: top, w: k.w, h: row.h, fill: c.fill });
      const inner = row.h - row.topW - row.botW;
      let dy = row.topW + c.margins.top;
      if (c.vAlign === 'center') dy += (inner - k.h) / 2;
      else if (c.vAlign === 'bottom') dy += inner - k.h;
      this.emitFlow(items, k.flow, cx + c.margins.left, top + dy);
      const line = (x1, y1, x2, y2, s) => s && items.push({ t: 'line', x1, y1, x2, y2, w: s.width, color: s.color });
      const yt = top + (k.bt ? k.bt.width / 2 : 0);
      const yb = top + row.h - (row.last && k.bb ? k.bb.width / 2 : 0);
      if (c.vMerge !== 'continue') line(cx, yt, cx + k.w, yt, k.bt);
      if (row.last && !row.continuedCols.has(c.col)) line(cx, yb, cx + k.w, yb, k.bb);
      line(cx, top, cx, top + row.h, k.bl);
      line(cx + k.w, top, cx + k.w, top + row.h, k.br);
    }
  }

  closeRow(items, row, x, bottomY) {
    for (const k of row.cells) {
      const s = k.bb;
      if (s) items.push({ t: 'line', x1: x + k.x, x2: x + k.x + k.w, y1: bottomY, y2: bottomY, w: s.width, color: s.color });
    }
  }

  paginate(measured, sec) {
    const pages = [];
    let page;
    let y;
    let atTop;
    const top = sec.top;
    const bottom = sec.height - sec.bottom;
    const newPage = () => { page = { items: [] }; pages.push(page); y = top; atTop = true; };
    newPage();
    let prev = null;
    const firstH = (m) => (!m ? 0 : m.kind === 'p' ? m.before + m.lines[0].h : m.kind === 'tbl' ? (m.rows[0] ? m.rows[0].h : 0) : 0);
    for (let i = 0; i < measured.length; i++) {
      const m = measured[i];
      if (m.kind === 'pagebreak') { newPage(); prev = null; continue; }
      if (m.kind === 'p') {
        if (m.pageBreakBefore && !atTop) newPage();
        let gap = atTop ? 0 : this.spacingGap(prev, m);
        const paraH = m.lines.reduce((a, l) => a + l.h, 0);
        let need = gap + (m.keepLines ? paraH : m.lines[0].h);
        if (m.keepNext) need = gap + paraH + firstH(measured[i + 1]);
        if (!atTop && y + need > bottom + 0.01) { newPage(); gap = 0; }
        y += gap;
        m.lines.forEach((ln, li) => {
          if (!atTop && y + ln.h > bottom + 0.01) newPage();
          this.emitLine(page.items, m, ln, sec.left, y, li === 0);
          y += ln.h;
          atTop = false;
        });
        const tmp = [];
        y = this.paraBorder(tmp, m, y);
        this.emitFlow(page.items, { entries: tmp }, sec.left, 0);
        prev = m;
      } else if (m.kind === 'tbl') {
        y += atTop ? 0 : prev ? prev.after : 0;
        let prevRow = null;
        for (const row of m.rows) {
          if (!atTop && y + row.h > bottom + 0.01) {
            if (prevRow) this.closeRow(page.items, prevRow, sec.left, y); // table continues on next page
            newPage();
          }
          this.emitRow(page.items, m, row, sec.left, y);
          y += row.h;
          atTop = false;
          prevRow = row;
        }
        prev = { after: 0, styleId: '__tbl__' };
      }
    }
    return pages;
  }
}
