// Office charts (DrawingML chartML, shared by .xlsx and .pptx) -> display-list items.
// Uses the values cached inside the chart part, so no formula evaluation is needed.
import { kid, kids, attr, descendants, num } from './xml.js';
import SSF from 'ssf';
import { dmlColor, colorChild } from './color.js';
import { DEFAULT_LIMITS, clampInt } from './limits.js';

const TYPES = ['barChart', 'bar3DChart', 'lineChart', 'line3DChart', 'pieChart', 'pie3DChart', 'doughnutChart', 'areaChart', 'area3DChart', 'scatterChart', 'radarChart', 'ofPieChart', 'stockChart', 'bubbleChart'];

function richText(el) {
  return descendants(el, 't').map((t) => t.textContent).join('');
}
function cacheValues(ref, limits) {
  const max = limits?.maxChartPoints ?? DEFAULT_LIMITS.maxChartPoints;
  const cache = descendants(ref, 'numCache')[0] || descendants(ref, 'strCache')[0] || descendants(ref, 'lvl')[0];
  if (!cache) {
    const lit = descendants(ref, 'pt').slice(0, max);
    return lit.map((p) => kid(p, 'v')?.textContent ?? '');
  }
  // c:ptCount and c:pt/@idx are file-supplied: clamp the count, and drop points whose index is outside it
  // (an idx of 1e9 would otherwise turn the array sparse and make every later loop run to 1e9)
  const n = clampInt(num(attr(kid(cache, 'ptCount'), 'val'), 0), 0, max);
  const out = new Array(n).fill(null);
  for (const p of kids(cache, 'pt')) {
    const i = num(attr(p, 'idx'), -1);
    if (Number.isInteger(i) && i >= 0 && i < n) out[i] = kid(p, 'v')?.textContent ?? null;
  }
  return out;
}
function solidFill(spPr, env) {
  const f = kid(spPr, 'solidFill');
  if (!f) return null;
  return dmlColor(colorChild(f), env)?.color || null;
}

/** theme: theme colours ({dk1, lt1, accent1..6, ...}); map: optional clrMap (tx1 -> dk1 ...) from a slide master */
export function parseChart(doc, theme, map = null, limits = DEFAULT_LIMITS) {
  const env = { theme, map };
  const root = doc.documentElement;
  const chart = kid(root, 'chart');
  const plot = kid(chart, 'plotArea');
  const groups = kids(plot).filter((e) => TYPES.includes(e.localName));
  const g = groups[0];
  const model = { type: 'bar', dir: 'col', grouping: 'clustered', series: [], categories: [], title: null, legend: null, gridlines: true, theme, fontSize: null, frame: null };
  // chart-area text size (c:txPr) and fill/border (c:spPr) on the chart space
  const defRPr = descendants(kid(root, 'txPr'), 'defRPr')[0];
  if (defRPr && attr(defRPr, 'sz')) model.fontSize = num(attr(defRPr, 'sz')) / 100;
  const csp = kid(root, 'spPr');
  if (csp) {
    const ln = kid(csp, 'ln');
    model.frame = {
      fill: kid(csp, 'noFill') ? null : solidFill(csp, env) || '#FFFFFF',
      stroke: !ln || kid(ln, 'noFill') ? null : solidFill(ln, env) || '#D9D9D9',
    };
  }
  const t = kid(chart, 'title');
  const autoDel = kid(chart, 'autoTitleDeleted');
  if (t) model.title = richText(t) || null;
  if (!g) return model;
  const ln = g.localName.replace('3D', '');
  model.type = { barChart: 'bar', lineChart: 'line', pieChart: 'pie', ofPieChart: 'pie', doughnutChart: 'doughnut', areaChart: 'area', scatterChart: 'scatter', bubbleChart: 'scatter', radarChart: 'radar', stockChart: 'line' }[ln] || 'bar';
  model.radarStyle = attr(kid(g, 'radarStyle'), 'val') || 'marker';
  model.dir = attr(kid(g, 'barDir'), 'val') || 'col';
  model.grouping = attr(kid(g, 'grouping'), 'val') || 'clustered';
  model.gap = num(attr(kid(g, 'gapWidth'), 'val'), 150);
  model.overlap = num(attr(kid(g, 'overlap'), 'val'), model.grouping === 'stacked' || model.grouping === 'percentStacked' ? 100 : 0);
  model.varyColors = attr(kid(g, 'varyColors'), 'val') === '1';
  const dlInfo = (el) => {
    if (!el) return null;
    if (attr(kid(el, 'delete'), 'val') === '1') return null;
    const flag = (k) => attr(kid(el, k), 'val') === '1';
    const info = { val: flag('showVal'), pct: flag('showPercent'), cat: flag('showCatName'), ser: flag('showSerName') };
    if (!info.val && !info.pct && !info.cat && !info.ser) return null;
    const rp = descendants(kid(el, 'txPr'), 'defRPr')[0];
    const nf = kid(el, 'numFmt');
    return {
      ...info, pos: attr(kid(el, 'dLblPos'), 'val') || null, fs: rp && attr(rp, 'sz') ? num(attr(rp, 'sz')) / 100 : null,
      color: rp ? solidFill(rp, env) : null, bold: rp ? attr(rp, 'b') === '1' : false,
      fmt: nf && attr(nf, 'sourceLinked') !== '1' ? attr(nf, 'formatCode') : null,
    };
  };
  const groupDl = dlInfo(kid(g, 'dLbls'));
  for (const s of kids(g, 'ser')) {
    const tx = kid(s, 'tx');
    const name = tx ? (cacheValues(tx, limits)[0] ?? richText(tx)) : null;
    const cat = kid(s, 'cat') || kid(s, 'xVal');
    const val = kid(s, 'val') || kid(s, 'yVal');
    // non-finite values (1e999, NaN) are treated as missing: they would make the axis maths loop forever
    const values = val ? cacheValues(val, limits).map((v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))) : [];
    const cats = cat ? cacheValues(cat, limits) : [];
    if (cats.length > model.categories.length) model.categories = cats;
    const ptColors = {};
    for (const dp of kids(s, 'dPt')) { const c = solidFill(kid(dp, 'spPr'), env); if (c) ptColors[num(attr(kid(dp, 'idx'), 'val'))] = c; }
    const fmt = descendants(val, 'formatCode')[0]?.textContent || null;
    const sln = kid(kid(s, 'spPr'), 'ln');
    const line = sln && !kid(sln, 'noFill') && solidFill(sln, env) ? { color: solidFill(sln, env), w: attr(sln, 'w') ? num(attr(sln, 'w')) / 12700 : 0.75 } : null;
    model.series.push({ name: name || `Series ${model.series.length + 1}`, named: !!name, values, color: solidFill(kid(s, 'spPr'), env), line, ptColors, fmt, dl: dlInfo(kid(s, 'dLbls')) || groupDl });
  }
  // PowerPoint/Excel title a single named series after it unless the title was deleted
  if (!model.title && !(autoDel && attr(autoDel, 'val') === '1') && model.series.length === 1 && model.series[0].named && model.type !== 'pie') model.title = model.series[0].name;
  const lg = kid(chart, 'legend');
  if (lg) model.legend = attr(kid(lg, 'legendPos'), 'val') || 'r';
  const valAx = kid(plot, 'valAx');
  model.gridlines = !valAx || !!kid(valAx, 'majorGridlines');
  const axInfo = (ax) => {
    if (!ax) return {};
    const tx = kid(ax, 'txPr');
    const bp = tx && kid(tx, 'bodyPr');
    const rp = tx && descendants(tx, 'defRPr')[0];
    const sc = kid(ax, 'scaling');
    const nf = kid(ax, 'numFmt');
    const v = (el) => (el ? num(attr(el, 'val')) : null);
    return {
      deleted: attr(kid(ax, 'delete'), 'val') === '1',
      lblPos: attr(kid(ax, 'tickLblPos'), 'val') || 'nextTo',
      rot: bp && attr(bp, 'rot') != null ? num(attr(bp, 'rot')) / 60000 : null,
      fs: rp && attr(rp, 'sz') ? num(attr(rp, 'sz')) / 100 : null,
      color: rp ? solidFill(rp, env) : null,
      min: v(kid(sc, 'min')), max: v(kid(sc, 'max')), unit: v(kid(ax, 'majorUnit')),
      reverse: attr(kid(sc, 'orientation'), 'val') === 'maxMin',
      fmt: nf && attr(nf, 'sourceLinked') !== '1' ? attr(nf, 'formatCode') : null,
      skip: v(kid(ax, 'tickLblSkip')),
    };
  };
  model.catAx = axInfo(kid(plot, 'catAx') || kid(plot, 'dateAx'));
  model.valAx = axInfo(valAx);
  // plot area position when the author placed it by hand (fractions of the chart box)
  const ml = descendants(kid(plot, 'layout'), 'manualLayout')[0];
  if (ml && attr(kid(ml, 'xMode'), 'val') === 'edge' && attr(kid(ml, 'yMode'), 'val') === 'edge') {
    const v = (k) => num(attr(kid(ml, k), 'val'));
    model.plotLayout = { inner: attr(kid(ml, 'layoutTarget'), 'val') === 'inner', x: v('x'), y: v('y'), w: v('w'), h: v('h') };
  }
  const tr = t && (descendants(t, 'defRPr')[0] || descendants(t, 'rPr')[0]);
  if (tr && attr(tr, 'sz')) model.titleFs = num(attr(tr, 'sz')) / 100;
  if (tr) { model.titleBold = attr(tr, 'b') === '1'; model.titleColor = solidFill(tr, env); }
  // value-axis number format: its own, or the source data's when linked ("General" means plain numbers)
  const nf = kid(valAx, 'numFmt');
  const srcFmt = descendants(kid(g, 'ser'), 'formatCode')[0]?.textContent || null;
  model.valFmt = nf && attr(nf, 'sourceLinked') !== '1' ? attr(nf, 'formatCode') : srcFmt || (nf ? attr(nf, 'formatCode') : null);
  return model;
}

const fmtNum = (v, code) => {
  if (code && code !== 'General') {
    try { return SSF.format(code, v); } catch { /* fall back to plain */ }
  }
  const r = Math.round(v * 1e9) / 1e9;
  return String(r);
};

/**
 * box: {x,y,w,h}; text(str, x, y(baseline), size, {color, bold, align, maxW}) -> pushes a text item
 * measure(str, size, bold) -> width
 */
export function drawChart(items, m0, box, { text, measure, frame = true, textScale = 1 }) {
  // explicit text sizes from the file are in chart units; scale them with the chart (Excel fit-to-page)
  const k = textScale || 1;
  const sc = (v) => (v ? v * k : v);
  const scAx = (a) => (a ? { ...a, fs: sc(a.fs) } : a);
  const m = k === 1 ? m0 : {
    ...m0, fontSize: sc(m0.fontSize), titleFs: sc(m0.titleFs), catAx: scAx(m0.catAx), valAx: scAx(m0.valAx),
    series: m0.series.map((s) => (s.dl ? { ...s, dl: { ...s.dl, fs: sc(s.dl.fs) } } : s)),
  };
  const accents = ['accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'].map((k) => m.theme[k]);
  const colorOf = (i, s) => s?.color || accents[i % 6];
  // chart area: explicit c:spPr wins; otherwise Excel draws a white box with a grey border and PowerPoint draws nothing
  const fr = m.frame || (frame ? { fill: '#FFFFFF', stroke: '#D9D9D9' } : null);
  if (fr && (fr.fill || fr.stroke)) items.push({ t: 'rect', x: box.x, y: box.y, w: box.w, h: box.h, fill: fr.fill, stroke: fr.stroke, lw: 0.75 });
  const pad = Math.max(4, Math.min(box.w, box.h) * 0.04);
  let top = box.y + pad;
  const fs = m.fontSize || Math.max(6, Math.min(10, box.h / 22));
  // rotated text: draw it, then wrap what was drawn in a rotation group around the anchor
  const rotText = (str, x, y, size, o, rot) => {
    if (!rot) { text(str, x, y, size, o); return; }
    const start = items.length;
    text(str, x, y, size, o);
    items.push({ t: 'group', rot, cx: x, cy: y, items: items.splice(start) });
  };
  if (m.title) {
    const ts = m.titleFs || fs * 1.4;
    text(m.title, box.x + box.w / 2, top + ts, ts, { align: 'center', color: m.titleColor || '#595959', maxW: box.w - 2 * pad, bold: m.titleBold });
    top += ts * 1.6;
  }
  let left = box.x + pad;
  let right = box.x + box.w - pad;
  let bottom = box.y + box.h - pad;
  const pie = m.type === 'pie' || m.type === 'doughnut';
  const legendItems = pie ? m.categories.map((c, i) => ({ name: String(c ?? ''), color: m.series[0]?.ptColors[i] || accents[i % 6] }))
    : m.series.map((s, i) => ({ name: s.name, color: colorOf(i, s) }));
  if (m.legend && legendItems.length) {
    const sw = fs * 0.6;
    if (m.legend === 'b' || m.legend === 't') {
      const widths = legendItems.map((l) => sw + 3 + measure(l.name, fs) + 10);
      let lx = box.x + (box.w - widths.reduce((a, b) => a + b, 0)) / 2;
      const ly = m.legend === 'b' ? bottom - fs : top;
      legendItems.forEach((l, i) => {
        items.push({ t: 'rect', x: lx, y: ly + fs * 0.1, w: sw, h: sw, fill: l.color });
        text(l.name, lx + sw + 3, ly + fs * 0.85, fs, { color: '#595959' });
        lx += widths[i];
      });
      if (m.legend === 'b') bottom -= fs * 1.8; else top += fs * 1.8;
    } else {
      const lw = Math.min(box.w * 0.35, Math.max(...legendItems.map((l) => measure(l.name, fs))) + sw + 8);
      let ly = top + (bottom - top) / 2 - (legendItems.length * fs * 1.5) / 2;
      for (const l of legendItems) {
        items.push({ t: 'rect', x: right - lw, y: ly + fs * 0.1, w: sw, h: sw, fill: l.color });
        text(l.name, right - lw + sw + 4, ly + fs * 0.85, fs, { color: '#595959', maxW: lw - sw - 4 });
        ly += fs * 1.5;
      }
      right -= lw + pad;
    }
  }
  if (!m.series.length || !m.series.some((s) => s.values.some((v) => v != null && Number.isFinite(v)))) return items;
  if (m.type === 'radar') return drawRadar(items, m, { left, right, top, bottom }, fs, colorOf, text);
  const dlText = (s, dl, i, v, total) => {
    const parts = [];
    if (dl.ser) parts.push(s.name);
    if (dl.cat) parts.push(String(m.categories[i] ?? ''));
    if (dl.val) parts.push(fmtNum(v, dl.fmt || s.fmt));
    if (dl.pct) parts.push(`${Math.round((v / (total || 1)) * 100)}%`);
    return parts.join(dl.cat && dl.val && !dl.pct ? ', ' : ' ');
  };
  if (pie) {
    const s0 = m.series[0];
    const vals = (s0?.values || []).map((v) => Math.max(0, v || 0));
    const total = vals.reduce((a, b) => a + b, 0) || 1;
    const r = Math.max(4, Math.min(right - left, bottom - top) / 2 - 2);
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    let a0 = -Math.PI / 2;
    const mids = [];
    vals.forEach((v, i) => {
      const a1 = a0 + (v / total) * Math.PI * 2;
      const pts = [[cx, cy]];
      const steps = Math.max(2, Math.ceil(((a1 - a0) / (Math.PI * 2)) * 72));
      for (let k = 0; k <= steps; k++) { const a = a0 + ((a1 - a0) * k) / steps; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      items.push({ t: 'shape', kind: 'polygon', points: pts, fill: s0.ptColors[i] || accents[i % 6], stroke: '#FFFFFF', lw: 0.75 });
      mids.push((a0 + a1) / 2);
      a0 = a1;
    });
    if (m.type === 'doughnut') items.push({ t: 'shape', kind: 'ellipse', x: cx - r / 2, y: cy - r / 2, w: r, h: r, fill: '#FFFFFF' });
    const dl = s0?.dl;
    if (dl) {
      const dfs = dl.fs || fs;
      vals.forEach((v, i) => {
        if (!v) return;
        const out = dl.pos === 'outEnd';
        const rr = out ? r + dfs * 0.9 : m.type === 'doughnut' ? r * 0.75 : r * 0.62;
        const x = cx + Math.cos(mids[i]) * rr;
        const y = cy + Math.sin(mids[i]) * rr + dfs * 0.35;
        text(dlText(s0, dl, i, v, total), x, y, dfs, { align: out ? (Math.cos(mids[i]) >= 0 ? 'left' : 'right') : 'center', color: dl.color || (out ? '#404040' : '#FFFFFF') });
      });
    }
    return items;
  }
  // ---------------------------------------------------------------- axes
  const cAx = m.catAx || {};
  const vAx = m.valAx || {};
  const catFs = cAx.fs || fs;
  const valFs = vAx.fs || fs;
  const showValLbl = !vAx.deleted && vAx.lblPos !== 'none';
  const showCatLbl = !cAx.deleted && cAx.lblPos !== 'none';
  const valFmt = vAx.fmt || m.valFmt;
  const stacked = m.grouping === 'stacked' || m.grouping === 'percentStacked';
  const nCat = Math.max(m.categories.length, ...m.series.map((s) => s.values.length), 1);
  let maxV = 0;
  let minV = 0;
  for (let i = 0; i < nCat; i++) {
    if (stacked) {
      let pos = 0;
      let neg = 0;
      for (const s of m.series) { const v = s.values[i] || 0; if (v >= 0) pos += v; else neg += v; }
      maxV = Math.max(maxV, pos); minV = Math.min(minV, neg);
    } else for (const s of m.series) { const v = s.values[i]; if (v != null) { maxV = Math.max(maxV, v); minV = Math.min(minV, v); } }
  }
  if (m.grouping === 'percentStacked') { maxV = 1; minV = 0; }
  let dataMin = Infinity;
  for (const s of m.series) for (const v of s.values) if (v != null) dataMin = Math.min(dataMin, v);
  let step;
  let vTop;
  let vBot;
  // Excel/PowerPoint auto axis: at most ~one interval per 1.8 label heights, 1-2-5 steps, and the maximum
  // padded by 5% of the range before rounding up (2970 -> 3500 with a 500 step, not 3000).
  const estH = Math.max(20, bottom - top - fs * 1.6);
  const maxIntervals = Math.max(3, Math.min(10, Math.floor(estH / (valFs * 1.8))));
  const pick = (lo, hi) => {
    const span = Math.max(hi - lo, 1e-9);
    const raw = span / maxIntervals;
    const p = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 5, 10].map((k) => k * p).find((v) => v >= raw * (1 - 1e-9)) || 10 * p;
  };
  if (m.grouping === 'percentStacked') {
    vBot = 0; vTop = 1; step = 0.1 * Math.ceil(10 / maxIntervals);
  } else if (!stacked && dataMin > 0 && dataMin > (maxV * 5) / 6 && m.type !== 'area' && vAx.min == null) {
    const pad = (maxV - dataMin) * 0.05;
    step = vAx.unit || pick(dataMin, maxV + pad);
    vBot = Math.max(0, Math.floor(dataMin / step) * step - step);
    vTop = vAx.max ?? Math.ceil((maxV + pad) / step) * step;
  } else {
    const lo = vAx.min ?? Math.min(0, minV);
    const hi = vAx.max ?? Math.max(0, maxV);
    const padHi = vAx.max == null && hi > 0 ? (hi - lo) * 0.05 : 0;
    const padLo = vAx.min == null && lo < 0 ? (hi - lo) * 0.05 : 0;
    step = vAx.unit || pick(lo - padLo, hi + padHi);
    vTop = vAx.max ?? (hi > 0 ? Math.ceil((hi + padHi) / step - 1e-9) * step : 0);
    vBot = vAx.min ?? (lo < 0 ? -Math.ceil((-lo + padLo) / step - 1e-9) * step : 0);
    if (vTop <= vBot) vTop = vBot + step;
  }
  if (!(step > 0) || (vTop - vBot) / step > 200) step = (vTop - vBot) / 5 || 1;
  const ticks = [];
  // bounded: huge-but-finite data can still overflow the sums to Infinity
  if (!Number.isFinite(vTop) || !Number.isFinite(vBot) || !(step > 0) || !Number.isFinite(step)) { vBot = 0; vTop = 1; step = 0.2; }
  for (let v = vBot; v <= vTop + step / 2 && ticks.length <= 1000; v += step) ticks.push(Math.round(v / step) * step);
  const horiz = m.type === 'bar' && m.dir === 'bar';
  const labelW = showValLbl ? Math.max(...ticks.map((v) => measure(fmtNum(v, valFmt), valFs))) + 4 : 2;
  const cats = Array.from({ length: nCat }, (_, i) => String(m.categories[i] ?? i + 1));
  const maxCatW = showCatLbl ? Math.max(...cats.map((c) => measure(c, catFs)), 0) : 0;
  // category labels: Excel turns them 45° (or 90°) when they don't fit side by side, then thins them out
  const slotEst = (horiz ? bottom - top : right - left - labelW) / nCat;
  let rot = 0;
  let skip = cAx.skip || 1;
  if (showCatLbl && !horiz) {
    if (cAx.rot != null) rot = cAx.rot;
    else if (maxCatW > slotEst * 0.95) rot = slotEst >= catFs * 1.4 ? -45 : -90;
    if (!cAx.skip) {
      const need = rot === 0 ? maxCatW * 1.1 : Math.abs(rot) >= 60 ? catFs * 1.15 : catFs * 1.45;
      skip = Math.max(1, Math.ceil(need / Math.max(1, slotEst)));
    }
  } else if (showCatLbl && horiz && !cAx.skip) skip = Math.max(1, Math.ceil((catFs * 1.15) / Math.max(1, slotEst)));
  const sinR = Math.abs(Math.sin((rot * Math.PI) / 180));
  const cosR = Math.abs(Math.cos((rot * Math.PI) / 180));
  const rotLen = Math.min(maxCatW, (bottom - top) * 0.45);
  const catLabelH = !showCatLbl ? fs * 0.5 : horiz ? (showValLbl ? valFs * 1.6 : valFs * 0.5) : rot ? rotLen * sinR + catFs * cosR + catFs * 0.6 : catFs * 1.6;
  const catLabelW = horiz && showCatLbl ? Math.min((right - left) * 0.35, maxCatW + 6) : 0;
  let plot;
  if (m.plotLayout && m.plotLayout.w > 0 && m.plotLayout.h > 0) {
    const L = m.plotLayout;
    plot = { x: box.x + L.x * box.w, y: box.y + L.y * box.h, w: L.w * box.w, h: L.h * box.h };
    if (!L.inner) {
      // outer layout includes the axis labels
      const dx = horiz ? catLabelW : labelW;
      const dy = horiz ? (showValLbl ? valFs * 1.6 : 0) : catLabelH;
      plot = { x: plot.x + dx, y: plot.y, w: plot.w - dx, h: plot.h - dy };
    }
  } else {
    plot = horiz ? { x: left + catLabelW, y: top } : { x: left + labelW, y: top + fs * 0.5 };
    plot.w = right - plot.x;
    plot.h = bottom - plot.y - catLabelH;
  }
  if (plot.w < 10 || plot.h < 10) return items;
  const span = vTop - vBot || 1;
  const vPos = (v) => {
    const f = (Math.max(vBot, Math.min(vTop, v)) - vBot) / span;
    return horiz ? plot.x + (vAx.reverse ? 1 - f : f) * plot.w : plot.y + plot.h - (vAx.reverse ? 1 - f : f) * plot.h;
  };
  const labelColor = (ax) => ax.color || '#595959';
  for (const v of ticks) {
    const p = vPos(v);
    if (horiz) {
      if (m.gridlines) items.push({ t: 'line', x1: p, y1: plot.y, x2: p, y2: plot.y + plot.h, w: 0.5, color: '#D9D9D9' });
      if (showValLbl) text(fmtNum(v, valFmt), p, plot.y + plot.h + valFs * 1.2, valFs, { align: 'center', color: labelColor(vAx) });
    } else {
      if (m.gridlines) items.push({ t: 'line', x1: plot.x, y1: p, x2: plot.x + plot.w, y2: p, w: 0.5, color: '#D9D9D9' });
      if (showValLbl) text(fmtNum(v, valFmt), plot.x - 4, p + valFs * 0.35, valFs, { align: 'right', color: labelColor(vAx) });
    }
  }
  const slot = (horiz ? plot.h : plot.w) / nCat;
  const catIndex = (i) => (cAx.reverse ? nCat - 1 - i : i);
  if (showCatLbl) {
    for (let i = 0; i < nCat; i += skip) {
      const k = catIndex(i);
      if (horiz) {
        // Excel draws the first category at the bottom of a horizontal bar chart
        const y = plot.y + plot.h - slot * (k + 0.5) + catFs * 0.35;
        text(cats[i], plot.x - 4, y, catFs, { align: 'right', color: labelColor(cAx), maxW: catLabelW - 4 });
      } else if (rot) {
        const x = plot.x + slot * (k + 0.5);
        const y = plot.y + plot.h + catFs * 0.4;
        if (rot < 0) rotText(cats[i], x + catFs * 0.35 * cosR, y + catFs * 0.35 * sinR, catFs, { align: 'right', color: labelColor(cAx), maxW: rotLen }, rot);
        else rotText(cats[i], x - catFs * 0.35 * cosR, y + catFs * 0.35 * sinR, catFs, { align: 'left', color: labelColor(cAx), maxW: rotLen }, rot);
      } else text(cats[i], plot.x + slot * (k + 0.5), plot.y + plot.h + catFs * 1.25, catFs, { align: 'center', color: labelColor(cAx), maxW: slot * skip });
    }
  }
  const zero = vPos(Math.max(vBot, Math.min(vTop, 0)));
  const marks = []; // for data labels: { s, i, v, x, y, w, h } (bars) or { s, i, v, x, y } (points)
  if (m.type === 'bar') {
    // gapWidth and overlap are percentages of one bar's width: slot = bars + gap
    const n = stacked ? 1 : m.series.length;
    const ov = stacked ? 1 : Math.max(-1, Math.min(1, (m.overlap || 0) / 100));
    const barW = slot / Math.max(0.1, n - (n - 1) * ov + m.gap / 100);
    const pitch = barW * (1 - ov);
    const groupW = barW + pitch * (n - 1);
    for (let i = 0; i < nCat; i++) {
      const k = catIndex(i);
      let pos = 0;
      let neg = 0;
      const tot = m.grouping === 'percentStacked' ? m.series.reduce((a, s) => a + Math.abs(s.values[i] || 0), 0) || 1 : 1;
      m.series.forEach((s, si) => {
        const raw = s.values[i];
        if (raw == null) return;
        let v = raw;
        if (m.grouping === 'percentStacked') v /= tot;
        let a = 0;
        let b = v;
        if (stacked) { if (v >= 0) { a = pos; pos += v; b = pos; } else { a = neg; neg += v; b = neg; } }
        const c = s.ptColors[i] || (m.varyColors && m.series.length === 1 ? accents[i % 6] : colorOf(si, s));
        const p1 = vPos(a);
        const p2 = vPos(b);
        if (horiz) {
          const off = slot * (nCat - 1 - k) + (slot - groupW) / 2 + (stacked ? 0 : (n - 1 - si) * pitch);
          const r = { x: Math.min(p1, p2), y: plot.y + off, w: Math.abs(p2 - p1), h: barW };
          items.push({ t: 'rect', ...r, fill: c, stroke: s.line?.color, lw: s.line?.w });
          marks.push({ s, i, v: raw, ...r, neg: v < 0 });
        } else {
          const off = slot * k + (slot - groupW) / 2 + (stacked ? 0 : si * pitch);
          const r = { x: plot.x + off, y: Math.min(p1, p2), w: barW, h: Math.abs(p2 - p1) };
          items.push({ t: 'rect', ...r, fill: c, stroke: s.line?.color, lw: s.line?.w });
          marks.push({ s, i, v: raw, ...r, neg: v < 0 });
        }
      });
    }
  } else {
    m.series.forEach((s, si) => {
      const c = colorOf(si, s);
      const pts = [];
      for (let i = 0; i < nCat; i++) if (s.values[i] != null) { pts.push([plot.x + slot * (catIndex(i) + 0.5), vPos(s.values[i])]); marks.push({ s, i, v: s.values[i], x: pts[pts.length - 1][0], y: pts[pts.length - 1][1] }); }
      if (m.type === 'area' && pts.length > 1) {
        items.push({ t: 'shape', kind: 'polygon', points: [[pts[0][0], zero], ...pts, [pts[pts.length - 1][0], zero]], fill: c, opacity: 0.8 });
      } else {
        const lc = s.line?.color || c;
        for (let k = 1; k < pts.length; k++) items.push({ t: 'line', x1: pts[k - 1][0], y1: pts[k - 1][1], x2: pts[k][0], y2: pts[k][1], w: s.line?.w || 1.75, color: lc });
        for (const [x, y] of pts) items.push({ t: 'shape', kind: 'ellipse', x: x - 2, y: y - 2, w: 4, h: 4, fill: c });
      }
    });
  }
  if (horiz) items.push({ t: 'line', x1: zero, y1: plot.y, x2: zero, y2: plot.y + plot.h, w: 0.75, color: '#BFBFBF' });
  else items.push({ t: 'line', x1: plot.x, y1: zero, x2: plot.x + plot.w, y2: zero, w: 0.75, color: '#BFBFBF' });
  // data labels
  for (const mk of marks) {
    const dl = mk.s.dl;
    if (!dl) continue;
    const dfs = dl.fs || fs;
    const str = dlText(mk.s, dl, mk.i, mk.v, 1);
    const color = dl.color || '#404040';
    const bold = dl.bold;
    if (mk.w != null) {
      const pos = dl.pos || (stacked ? 'ctr' : 'outEnd');
      if (horiz) {
        const endX = mk.neg ? mk.x : mk.x + mk.w;
        const y = mk.y + mk.h / 2 + dfs * 0.35;
        if (pos === 'ctr') text(str, mk.x + mk.w / 2, y, dfs, { align: 'center', color });
        else if (pos === 'inEnd') text(str, mk.neg ? endX + 3 : endX - 3, y, dfs, { align: mk.neg ? 'left' : 'right', color });
        else if (pos === 'inBase') text(str, mk.neg ? mk.x + mk.w - 3 : mk.x + 3, y, dfs, { align: mk.neg ? 'right' : 'left', color });
        else text(str, mk.neg ? endX - 3 : endX + 3, y, dfs, { align: mk.neg ? 'right' : 'left', color });
      } else {
        const x = mk.x + mk.w / 2;
        const topY = mk.neg ? mk.y + mk.h : mk.y;
        let y;
        if (pos === 'ctr') y = mk.y + mk.h / 2 + dfs * 0.35;
        else if (pos === 'inEnd') y = mk.neg ? topY - 3 : topY + dfs;
        else if (pos === 'inBase') y = mk.neg ? mk.y + dfs : mk.y + mk.h - 3;
        else y = mk.neg ? topY + dfs + 2 : topY - 3;
        text(str, x, y, dfs, { align: 'center', color });
      }
    } else {
      const pos = dl.pos || 'r';
      if (pos === 't') text(str, mk.x, mk.y - 5, dfs, { align: 'center', color });
      else if (pos === 'b') text(str, mk.x, mk.y + dfs + 3, dfs, { align: 'center', color });
      else if (pos === 'l') text(str, mk.x - 5, mk.y + dfs * 0.35, dfs, { align: 'right', color });
      else if (pos === 'ctr') text(str, mk.x, mk.y + dfs * 0.35, dfs, { align: 'center', color });
      else text(str, mk.x + 5, mk.y + dfs * 0.35, dfs, { align: 'left', color });
    }
  }
  return items;
}

function drawRadar(items, m, { left, right, top, bottom }, fs, colorOf, text) {
  const n = Math.max(m.categories.length, ...m.series.map((s) => s.values.length));
  if (n < 3) return items;
  let max = 0;
  for (const s of m.series) for (const v of s.values) if (v != null) max = Math.max(max, v);
  const raw = (max || 1) / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((k) => k * p).find((v) => v >= raw) || 10 * p;
  const top_ = Math.ceil((max || 1) / step) * step;
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2 + fs * 0.3;
  const r = Math.max(4, Math.min(right - left, bottom - top) / 2 - fs * 1.6);
  const at = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * r * (v / top_), cy + Math.sin(a) * r * (v / top_)]; };
  for (let v = step, k = 0; v <= top_ + step / 2 && k < 100; v += step, k++) {
    items.push({ t: 'shape', kind: 'polygon', points: Array.from({ length: n }, (_, i) => at(i, v)), stroke: '#D9D9D9', lw: 0.5 });
    text(fmtNum(v, m.valFmt), cx + 2, at(0, v)[1] + fs * 0.35, fs * 0.9, { color: '#595959' });
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = at(i, top_);
    items.push({ t: 'line', x1: cx, y1: cy, x2: x, y2: y, w: 0.5, color: '#D9D9D9' });
    const [lx, ly] = at(i, top_ * 1.12);
    text(String(m.categories[i] ?? i + 1), lx, ly + fs * 0.35, fs, { align: Math.abs(lx - cx) < 2 ? 'center' : lx < cx ? 'right' : 'left', color: '#595959' });
  }
  m.series.forEach((s, si) => {
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(at(i, Math.max(0, s.values[i] || 0)));
    const c = colorOf(si, s);
    if (m.radarStyle === 'filled') items.push({ t: 'shape', kind: 'polygon', points: pts, fill: c, opacity: 0.6 });
    else {
      items.push({ t: 'shape', kind: 'polygon', points: pts, stroke: c, lw: 1.75 });
      if (m.radarStyle === 'marker') for (const [x, y] of pts) items.push({ t: 'shape', kind: 'ellipse', x: x - 2, y: y - 2, w: 4, h: 4, fill: c });
    }
  });
  return items;
}
