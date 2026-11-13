// DrawingML geometry -> path commands in shape-local points (0..w, 0..h).
// Covers the preset shapes that make up nearly all real slides (rectangles, rounded/snipped rectangles,
// ellipses, triangles, arrows, chevrons, stars, flowchart symbols, callouts, brackets, connectors) and
// evaluates custom geometry (a:custGeom) with its guide formulas. Unknown presets fall back to a rectangle.
import { kid, kids, attr, descendants } from '../common/xml.js';

class Path {
  constructor() { this.d = []; this.x = 0; this.y = 0; this.sx = 0; this.sy = 0; }
  M(x, y) { this.d.push(['M', x, y]); this.x = this.sx = x; this.y = this.sy = y; return this; }
  L(x, y) { this.d.push(['L', x, y]); this.x = x; this.y = y; return this; }
  C(x1, y1, x2, y2, x, y) { this.d.push(['C', x1, y1, x2, y2, x, y]); this.x = x; this.y = y; return this; }
  Q(x1, y1, x, y) { this.d.push(['Q', x1, y1, x, y]); this.x = x; this.y = y; return this; }
  Z() { if (this.d.length) this.d.push(['Z']); this.x = this.sx; this.y = this.sy; return this; }
  poly(pts, close = true) {
    pts.forEach(([x, y], i) => (i ? this.L(x, y) : this.M(x, y)));
    return close ? this.Z() : this;
  }
  /** elliptical arc around (cx, cy) from parametric angle t0 to t1 (radians; y grows downwards so + is clockwise) */
  E(cx, cy, rx, ry, t0, t1) {
    // angles can come from the file (arcTo swAng): cap the segment count so 1e15 radians can't loop forever
    const n = Math.min(64, Math.max(1, Math.ceil(Math.abs(t1 - t0) / (Math.PI / 2) - 1e-9) || 1));
    const dt = (t1 - t0) / n;
    const k = (4 / 3) * Math.tan(dt / 4);
    for (let i = 0; i < n; i++) {
      const a = t0 + i * dt;
      const b = a + dt;
      const x0 = cx + rx * Math.cos(a);
      const y0 = cy + ry * Math.sin(a);
      const x3 = cx + rx * Math.cos(b);
      const y3 = cy + ry * Math.sin(b);
      this.C(x0 - k * rx * Math.sin(a), y0 + k * ry * Math.cos(a), x3 + k * rx * Math.sin(b), y3 - k * ry * Math.cos(b), x3, y3);
    }
    return this;
  }
  ellipse(cx, cy, rx, ry) { return this.M(cx + rx, cy).E(cx, cy, rx, ry, 0, 2 * Math.PI).Z(); }
  /** DrawingML a:arcTo from the current point: radii and visual start/sweep angles in degrees */
  arcTo(wR, hR, stAng, swAng) {
    if (!(wR > 0) || !(hR > 0) || !swAng) return this;
    const par = (deg) => { const r = (deg * Math.PI) / 180; return Math.atan2(wR * Math.sin(r), hR * Math.cos(r)); };
    const t0 = par(stAng);
    let t1;
    if (Math.abs(swAng) >= 360) t1 = t0 + Math.sign(swAng) * 2 * Math.PI;
    else {
      t1 = par(stAng + swAng);
      if (swAng > 0) while (t1 <= t0) t1 += 2 * Math.PI;
      else while (t1 >= t0) t1 -= 2 * Math.PI;
    }
    return this.E(this.x - wR * Math.cos(t0), this.y - hR * Math.sin(t0), wR, hR, t0, t1);
  }
  /** rectangle with corner radii [tl, tr, br, bl] */
  roundRect(w, h, [tl, tr, br, bl]) {
    const q = Math.PI / 2;
    this.M(tl, 0).L(w - tr, 0);
    if (tr) this.E(w - tr, tr, tr, tr, -q, 0);
    this.L(w, h - br);
    if (br) this.E(w - br, h - br, br, br, 0, q);
    this.L(bl, h);
    if (bl) this.E(bl, h - bl, bl, bl, q, 2 * q);
    this.L(0, tl);
    if (tl) this.E(tl, tl, tl, tl, 2 * q, 3 * q);
    return this.Z();
  }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const DEFAULTS = {
  roundRect: { adj: 16667 }, round1Rect: { adj: 16667 }, round2SameRect: { adj1: 16667, adj2: 0 }, round2DiagRect: { adj1: 16667, adj2: 0 },
  snip1Rect: { adj: 16667 }, snip2SameRect: { adj1: 16667, adj2: 0 }, snip2DiagRect: { adj1: 0, adj2: 16667 }, snipRoundRect: { adj1: 16667, adj2: 16667 },
  triangle: { adj: 50000 }, parallelogram: { adj: 25000 }, trapezoid: { adj: 25000 }, hexagon: { adj: 25000 }, octagon: { adj: 29289 },
  homePlate: { adj: 50000 }, chevron: { adj: 50000 }, plus: { adj: 25000 }, donut: { adj: 25000 }, frame: { adj1: 12500 },
  rightArrow: { adj1: 50000, adj2: 50000 }, leftArrow: { adj1: 50000, adj2: 50000 }, upArrow: { adj1: 50000, adj2: 50000 }, downArrow: { adj1: 50000, adj2: 50000 },
  leftRightArrow: { adj1: 50000, adj2: 50000 }, upDownArrow: { adj1: 50000, adj2: 50000 }, notchedRightArrow: { adj1: 50000, adj2: 50000 },
  bentConnector3: { adj1: 50000 }, bentConnector4: { adj1: 50000, adj2: 50000 }, bentConnector5: { adj1: 50000, adj2: 50000, adj3: 50000 },
  curvedConnector3: { adj1: 50000 }, curvedConnector4: { adj1: 50000, adj2: 50000 }, curvedConnector5: { adj1: 50000, adj2: 50000, adj3: 50000 },
  arc: { adj1: 16200000, adj2: 0 }, pie: { adj1: 0, adj2: 16200000 }, chord: { adj1: 2700000, adj2: 16200000 }, blockArc: { adj1: 10800000, adj2: 0, adj3: 25000 },
  can: { adj: 25000 }, cube: { adj: 25000 }, bevel: { adj: 12500 }, foldedCorner: { adj: 16667 },
  wedgeRectCallout: { adj1: -20833, adj2: 62500 }, wedgeRoundRectCallout: { adj1: -20833, adj2: 62500, adj3: 16667 }, wedgeEllipseCallout: { adj1: -20833, adj2: 62500 },
  leftBracket: { adj: 8333 }, rightBracket: { adj: 8333 }, bracketPair: { adj: 16667 }, leftBrace: { adj1: 8333, adj2: 50000 }, rightBrace: { adj1: 8333, adj2: 50000 }, bracePair: { adj: 8333 },
  star4: { adj: 12500 }, star5: { adj: 19098 }, star6: { adj: 28868 }, star7: { adj: 34601 }, star8: { adj: 38250 }, star10: { adj: 42533 }, star12: { adj: 37500 },
  star16: { adj: 37500 }, star24: { adj: 37500 }, star32: { adj: 37500 },
};
const CALLOUT_ADJ = [[18750, -8333, 112500, -38333], [18750, -8333, 18750, -16667, 112500, -46667], [18750, -8333, 18750, -16667, 100000, -16667, 112963, -8333]];

/**
 * prst: preset name; w, h: size in points; av: adjust values from a:avLst ({adj: 16667, ...}).
 * Returns { paths: [{ d, fill, stroke, evenOdd? }], text: { l, t, r, b } } in shape-local points.
 */
export function presetGeometry(prst, w, h, av = {}) {
  const A = { ...(DEFAULTS[prst] || {}), ...av };
  const a = (k) => A[k] ?? A.adj ?? 0;
  const ss = Math.min(w, h);
  const hc = w / 2;
  const vc = h / 2;
  const P = () => new Path();
  const one = (p, text = { l: 0, t: 0, r: w, b: h }, extra = {}) => ({ paths: [{ d: p.d, fill: true, stroke: true, ...extra }], text });
  const line = (p) => ({ paths: [{ d: p.d, fill: false, stroke: true }], text: { l: 0, t: 0, r: w, b: h } });
  switch (prst) {
    case 'rect': case 'flowChartProcess': case 'textBox': case undefined: case null:
      return one(P().poly([[0, 0], [w, 0], [w, h], [0, h]]));
    case 'roundRect': case 'flowChartAlternateProcess': {
      const r = (ss * clamp(prst === 'roundRect' ? a('adj') : 16667, 0, 50000)) / 100000;
      const il = r * 0.29289;
      return one(P().roundRect(w, h, [r, r, r, r]), { l: il, t: il, r: w - il, b: h - il });
    }
    case 'round1Rect': { const r = (ss * clamp(a('adj'), 0, 50000)) / 100000; return one(P().roundRect(w, h, [0, r, 0, 0]), { l: 0, t: 0, r: w - r * 0.29289, b: h }); }
    case 'round2SameRect': {
      const r1 = (ss * clamp(a('adj1'), 0, 50000)) / 100000; const r2 = (ss * clamp(a('adj2'), 0, 50000)) / 100000;
      return one(P().roundRect(w, h, [r1, r1, r2, r2]), { l: r1 * 0.29289, t: r1 * 0.29289, r: w - r1 * 0.29289, b: h - r2 * 0.29289 });
    }
    case 'round2DiagRect': {
      const r1 = (ss * clamp(a('adj1'), 0, 50000)) / 100000; const r2 = (ss * clamp(a('adj2'), 0, 50000)) / 100000;
      const i = Math.max(r1, r2) * 0.29289;
      return one(P().roundRect(w, h, [r1, r2, r1, r2]), { l: i, t: i, r: w - i, b: h - i });
    }
    case 'snip1Rect': { const d = (ss * clamp(a('adj'), 0, 50000)) / 100000; return one(P().poly([[0, 0], [w - d, 0], [w, d], [w, h], [0, h]]), { l: 0, t: d / 2, r: w - d / 2, b: h }); }
    case 'snip2SameRect': {
      const d1 = (ss * clamp(a('adj1'), 0, 50000)) / 100000; const d2 = (ss * clamp(a('adj2'), 0, 50000)) / 100000;
      return one(P().poly([[d1, 0], [w - d1, 0], [w, d1], [w, h - d2], [w - d2, h], [d2, h], [0, h - d2], [0, d1]]), { l: d1 / 2, t: d1 / 2, r: w - d1 / 2, b: h - d2 / 2 });
    }
    case 'snip2DiagRect': {
      const d1 = (ss * clamp(a('adj1'), 0, 50000)) / 100000; const d2 = (ss * clamp(a('adj2'), 0, 50000)) / 100000;
      return one(P().poly([[d1, 0], [w - d2, 0], [w, d2], [w, h - d1], [w - d1, h], [d2, h], [0, h - d2], [0, d1]]), { l: d1 / 2, t: d1 / 2, r: w - d1 / 2, b: h - d1 / 2 });
    }
    case 'snipRoundRect': {
      const r = (ss * clamp(a('adj1'), 0, 50000)) / 100000; const d = (ss * clamp(a('adj2'), 0, 50000)) / 100000;
      const p = P().M(r, 0).L(w - d, 0).L(w, d).L(w, h).L(0, h).L(0, r);
      if (r) p.E(r, r, r, r, Math.PI, 1.5 * Math.PI);
      return one(p.Z(), { l: r * 0.29289, t: r * 0.29289, r: w - d / 2, b: h });
    }
    case 'ellipse': case 'flowChartConnector': {
      const il = hc * (1 - Math.SQRT1_2);
      const it = vc * (1 - Math.SQRT1_2);
      return one(P().ellipse(hc, vc, hc, vc), { l: il, t: it, r: w - il, b: h - it });
    }
    case 'triangle': case 'flowChartExtract': {
      const t = prst === 'triangle' ? clamp(a('adj'), 0, 100000) : 50000;
      const x2 = (w * t) / 100000; const x1 = x2 / 2;
      return one(P().poly([[x2, 0], [w, h], [0, h]]), { l: x1, t: vc, r: x1 + hc, b: h });
    }
    case 'flowChartMerge': return one(P().poly([[0, 0], [w, 0], [hc, h]]), { l: w / 4, t: 0, r: (3 * w) / 4, b: vc });
    case 'rtTriangle': return one(P().poly([[0, h], [0, 0], [w, h]]), { l: w / 12, t: (7 * h) / 12, r: (7 * w) / 12, b: (11 * h) / 12 });
    case 'diamond': case 'flowChartDecision': return one(P().poly([[hc, 0], [w, vc], [hc, h], [0, vc]]), { l: w / 4, t: h / 4, r: (3 * w) / 4, b: (3 * h) / 4 });
    case 'parallelogram': case 'flowChartInputOutput': {
      const x2 = prst === 'parallelogram' ? (ss * clamp(a('adj'), 0, (100000 * w) / ss)) / 100000 : w / 5;
      return one(P().poly([[0, h], [x2, 0], [w, 0], [w - x2, h]]), { l: x2 / 2, t: (h * x2) / (2 * w || 1), r: w - x2 / 2, b: h - (h * x2) / (2 * w || 1) });
    }
    case 'trapezoid': case 'flowChartManualOperation': {
      if (prst === 'flowChartManualOperation') return one(P().poly([[0, 0], [w, 0], [(4 * w) / 5, h], [w / 5, h]]), { l: w / 5, t: 0, r: (4 * w) / 5, b: h });
      const maxAdj = (50000 * w) / ss;
      const t = clamp(a('adj'), 0, maxAdj);
      const x2 = (ss * t) / 100000;
      return one(P().poly([[0, h], [x2, 0], [w - x2, 0], [w, h]]), { l: ((w / 3) * t) / maxAdj, t: ((h / 3) * t) / maxAdj, r: w - ((w / 3) * t) / maxAdj, b: h });
    }
    case 'pentagon': return one(P().poly([[hc, 0], [w, 0.382 * h], [0.809 * w, h], [0.191 * w, h], [0, 0.382 * h]]), { l: 0.2 * w, t: 0.3 * h, r: 0.8 * w, b: h });
    case 'homePlate': {
      const x1 = w - (ss * clamp(a('adj'), 0, (100000 * w) / ss)) / 100000;
      return one(P().poly([[0, 0], [x1, 0], [w, vc], [x1, h], [0, h]]), { l: 0, t: 0, r: (x1 + w) / 2, b: h });
    }
    case 'chevron': {
      const x1 = (ss * clamp(a('adj'), 0, (100000 * w) / ss)) / 100000;
      return one(P().poly([[0, 0], [w - x1, 0], [w, vc], [w - x1, h], [0, h], [x1, vc]]), { l: x1, t: 0, r: w - x1, b: h });
    }
    case 'hexagon': case 'flowChartPreparation': {
      const x1 = prst === 'hexagon' ? (ss * clamp(a('adj'), 0, (50000 * w) / ss)) / 100000 : w / 5;
      return one(P().poly([[0, vc], [x1, 0], [w - x1, 0], [w, vc], [w - x1, h], [x1, h]]), { l: x1 / 2, t: h * 0.07, r: w - x1 / 2, b: h * 0.93 });
    }
    case 'octagon': {
      const x1 = (ss * clamp(a('adj'), 0, 50000)) / 100000;
      return one(P().poly([[0, x1], [x1, 0], [w - x1, 0], [w, x1], [w, h - x1], [w - x1, h], [x1, h], [0, h - x1]]), { l: x1 / 2, t: x1 / 2, r: w - x1 / 2, b: h - x1 / 2 });
    }
    case 'plus': case 'flowChartSummingJunction': {
      if (prst !== 'plus') return { paths: [{ d: P().ellipse(hc, vc, hc, vc).d, fill: true, stroke: true }, { d: P().M(hc * (1 - Math.SQRT1_2), vc * (1 - Math.SQRT1_2)).L(hc * (1 + Math.SQRT1_2), vc * (1 + Math.SQRT1_2)).M(hc * (1 + Math.SQRT1_2), vc * (1 - Math.SQRT1_2)).L(hc * (1 - Math.SQRT1_2), vc * (1 + Math.SQRT1_2)).d, fill: false, stroke: true }], text: { l: w * 0.15, t: h * 0.15, r: w * 0.85, b: h * 0.85 } };
      const x1 = (ss * clamp(a('adj'), 0, 50000)) / 100000;
      return one(P().poly([[0, x1], [x1, x1], [x1, 0], [w - x1, 0], [w - x1, x1], [w, x1], [w, h - x1], [w - x1, h - x1], [w - x1, h], [x1, h], [x1, h - x1], [0, h - x1]]), { l: 0, t: x1, r: w, b: h - x1 });
    }
    case 'rightArrow': case 'leftArrow': case 'upArrow': case 'downArrow': case 'notchedRightArrow': {
      // build a right-pointing arrow in (along, across) space, then map to the real direction
      const vertical = prst === 'upArrow' || prst === 'downArrow';
      const L = vertical ? h : w;
      const T = vertical ? w : h;
      const head = (ss * clamp(a('adj2'), 0, (100000 * L) / ss)) / 100000;
      const half = (T * clamp(a('adj1'), 0, 100000)) / 200000;
      const x1 = L - head;
      const y1 = T / 2 - half;
      const y2 = T / 2 + half;
      let pts = [[0, y1], [x1, y1], [x1, 0], [L, T / 2], [x1, T], [x1, y2], [0, y2]];
      if (prst === 'notchedRightArrow') pts.push([(half * head) / (T / 2 || 1), T / 2]);
      const tx2 = x1 + (y1 * head) / (T / 2 || 1);
      let text = { l: 0, t: y1, r: tx2, b: y2 };
      const map = {
        rightArrow: ([u, v]) => [u, v], notchedRightArrow: ([u, v]) => [u, v], leftArrow: ([u, v]) => [w - u, v],
        downArrow: ([u, v]) => [v, u], upArrow: ([u, v]) => [v, h - u],
      }[prst];
      pts = pts.map(map);
      const [p, q] = [map([text.l, text.t]), map([text.r, text.b])];
      text = { l: Math.min(p[0], q[0]), t: Math.min(p[1], q[1]), r: Math.max(p[0], q[0]), b: Math.max(p[1], q[1]) };
      return one(P().poly(pts), text);
    }
    case 'leftRightArrow': case 'upDownArrow': {
      const vertical = prst === 'upDownArrow';
      const L = vertical ? h : w;
      const T = vertical ? w : h;
      const head = (ss * clamp(a('adj2'), 0, (50000 * L) / ss)) / 100000;
      const half = (T * clamp(a('adj1'), 0, 100000)) / 200000;
      const y1 = T / 2 - half;
      const y2 = T / 2 + half;
      let pts = [[0, T / 2], [head, 0], [head, y1], [L - head, y1], [L - head, 0], [L, T / 2], [L - head, T], [L - head, y2], [head, y2], [head, T]];
      if (vertical) pts = pts.map(([u, v]) => [v, u]);
      return one(P().poly(pts), vertical ? { l: y1, t: head / 2, r: y2, b: h - head / 2 } : { l: head / 2, t: y1, r: w - head / 2, b: y2 });
    }
    case 'line': case 'straightConnector1': return line(P().M(0, 0).L(w, h));
    case 'bentConnector2': return line(P().M(0, 0).L(w, 0).L(w, h));
    case 'bentConnector3': { const x1 = (w * a('adj1')) / 100000; return line(P().M(0, 0).L(x1, 0).L(x1, h).L(w, h)); }
    case 'bentConnector4': { const x1 = (w * a('adj1')) / 100000; const y2 = (h * a('adj2')) / 100000; return line(P().M(0, 0).L(x1, 0).L(x1, y2).L(w, y2).L(w, h)); }
    case 'bentConnector5': {
      const x1 = (w * a('adj1')) / 100000; const y2 = (h * a('adj2')) / 100000; const x3 = (w * a('adj3')) / 100000;
      return line(P().M(0, 0).L(x1, 0).L(x1, y2).L(x3, y2).L(x3, h).L(w, h));
    }
    case 'curvedConnector2': return line(P().M(0, 0).C(w / 2, 0, w, h / 2, w, h));
    case 'curvedConnector3': case 'curvedConnector4': case 'curvedConnector5': {
      const x2 = (w * a('adj1')) / 100000;
      return line(P().M(0, 0).C(x2 / 2, 0, x2, h / 4, x2, vc).C(x2, (3 * h) / 4, (x2 + w) / 2, h, w, h));
    }
    case 'arc': case 'pie': case 'chord': case 'blockArc': {
      const st = a('adj1') / 60000;
      let sw = a('adj2') / 60000 - st;
      if (sw <= 0) sw += 360;
      const pt = (deg) => { const r = (deg * Math.PI) / 180; const t = Math.atan2(hc * Math.sin(r), vc * Math.cos(r)); return [hc + hc * Math.cos(t), vc + vc * Math.sin(t)]; };
      const [sx, sy] = pt(st);
      const arc = () => P().M(sx, sy).arcTo(hc, vc, st, sw);
      if (prst === 'arc') return { paths: [{ d: [...arc().L(hc, vc).Z().d], fill: true, stroke: false }, { d: arc().d, fill: false, stroke: true }], text: { l: 0, t: 0, r: w, b: h } };
      if (prst === 'pie') return one(arc().L(hc, vc).Z());
      if (prst === 'chord') return one(arc().Z());
      // blockArc: thick ring segment
      const dr = (ss * clamp(a('adj3'), 0, 50000)) / 100000;
      const ir = [hc - dr, vc - dr];
      const p = arc();
      const r2 = (deg) => { const r = (deg * Math.PI) / 180; const t = Math.atan2(ir[0] * Math.sin(r), ir[1] * Math.cos(r)); return [hc + ir[0] * Math.cos(t), vc + ir[1] * Math.sin(t)]; };
      const [ex, ey] = r2(st + sw);
      p.L(ex, ey).arcTo(ir[0], ir[1], st + sw, -sw).Z();
      return one(p);
    }
    case 'donut': {
      const dr = (ss * clamp(a('adj'), 0, 50000)) / 100000;
      const p = P().ellipse(hc, vc, hc, vc).ellipse(hc, vc, Math.max(0, hc - dr), Math.max(0, vc - dr));
      return one(p, { l: hc * (1 - Math.SQRT1_2), t: vc * (1 - Math.SQRT1_2), r: w - hc * (1 - Math.SQRT1_2), b: h - vc * (1 - Math.SQRT1_2) }, { evenOdd: true });
    }
    case 'frame': {
      const d = (ss * clamp(a('adj1'), 0, 50000)) / 100000;
      return one(P().poly([[0, 0], [w, 0], [w, h], [0, h]]).poly([[d, d], [d, h - d], [w - d, h - d], [w - d, d]]), { l: d, t: d, r: w - d, b: h - d }, { evenOdd: true });
    }
    case 'can': case 'flowChartMagneticDisk': {
      const ry = prst === 'can' ? (ss * clamp(a('adj'), 0, (50000 * h) / ss)) / 200000 : h / 6;
      const body = P().M(0, ry).L(0, h - ry).E(hc, h - ry, hc, ry, Math.PI, 0).L(w, ry).E(hc, ry, hc, ry, 0, Math.PI).Z();
      const top = P().ellipse(hc, ry, hc, ry);
      return { paths: [{ d: body.d, fill: true, stroke: true }, { d: top.d, fill: true, stroke: true }], text: { l: 0, t: ry * 2, r: w, b: h - ry } };
    }
    case 'cube': {
      const d = (ss * clamp(a('adj'), 0, 100000)) / 100000;
      return {
        paths: [
          { d: P().poly([[0, d], [w - d, d], [w - d, h], [0, h]]).d, fill: true, stroke: true },
          { d: P().poly([[0, d], [d, 0], [w, 0], [w - d, d]]).d, fill: true, stroke: true },
          { d: P().poly([[w - d, d], [w, 0], [w, h - d], [w - d, h]]).d, fill: true, stroke: true },
        ],
        text: { l: 0, t: d, r: w - d, b: h },
      };
    }
    case 'bevel': {
      const d = (ss * clamp(a('adj'), 0, 50000)) / 100000;
      return { paths: [{ d: P().poly([[0, 0], [w, 0], [w, h], [0, h]]).d, fill: true, stroke: true }, { d: P().poly([[d, d], [w - d, d], [w - d, h - d], [d, h - d]]).d, fill: false, stroke: true }], text: { l: d, t: d, r: w - d, b: h - d } };
    }
    case 'foldedCorner': {
      const d = (ss * clamp(a('adj'), 0, 50000)) / 100000;
      return { paths: [{ d: P().poly([[0, 0], [w, 0], [w, h - d], [w - d, h], [0, h]]).d, fill: true, stroke: true }, { d: P().poly([[w - d, h], [w - d * 0.8, h - d * 0.8], [w, h - d]]).d, fill: true, stroke: true }], text: { l: 0, t: 0, r: w, b: h - d } };
    }
    case 'flowChartPredefinedProcess': {
      return { paths: [{ d: P().poly([[0, 0], [w, 0], [w, h], [0, h]]).d, fill: true, stroke: true }, { d: P().M(w / 8, 0).L(w / 8, h).M((7 * w) / 8, 0).L((7 * w) / 8, h).d, fill: false, stroke: true }], text: { l: w / 8, t: 0, r: (7 * w) / 8, b: h } };
    }
    case 'flowChartDocument': case 'flowChartMultidocument': {
      const p = P().M(0, 0).L(w, 0).L(w, h * 0.83).C(w * 0.75, h * 0.7, w * 0.5, h * 0.75, w * 0.5, h * 0.9).C(w * 0.5, h * 1.02, w * 0.2, h * 1.02, 0, h * 0.93).Z();
      return one(p, { l: 0, t: 0, r: w, b: h * 0.8 });
    }
    case 'flowChartTerminator': { const r = Math.min(vc, hc); return one(P().roundRect(w, h, [r, r, r, r]), { l: r * 0.29, t: h * 0.15, r: w - r * 0.29, b: h * 0.85 }); }
    case 'flowChartManualInput': return one(P().poly([[0, h / 5], [w, 0], [w, h], [0, h]]), { l: 0, t: h / 5, r: w, b: h });
    case 'flowChartOffpageConnector': return one(P().poly([[0, 0], [w, 0], [w, 0.8 * h], [hc, h], [0, 0.8 * h]]), { l: 0, t: 0, r: w, b: 0.8 * h });
    case 'flowChartDelay': return one(P().M(0, 0).L(hc, 0).E(hc, vc, hc, vc, -Math.PI / 2, Math.PI / 2).L(0, h).Z(), { l: 0, t: h * 0.15, r: w * 0.85, b: h * 0.85 });
    case 'flowChartPunchedCard': return one(P().poly([[w / 5, 0], [w, 0], [w, h], [0, h], [0, h / 5]]), { l: 0, t: h / 5, r: w, b: h });
    case 'wedgeRectCallout': case 'wedgeRoundRectCallout': case 'wedgeEllipseCallout': {
      const tx = hc + (w * a('adj1')) / 100000;
      const ty = vc + (h * a('adj2')) / 100000;
      if (prst === 'wedgeEllipseCallout') {
        const ang = (Math.atan2((ty - vc) / (vc || 1), (tx - hc) / (hc || 1)) * 180) / Math.PI;
        const s0 = ang + 11;
        const pt = (deg) => { const r = (deg * Math.PI) / 180; return [hc + hc * Math.cos(r), vc + vc * Math.sin(r)]; };
        const [sx, sy] = pt(s0);
        const p = P().M(sx, sy).E(hc, vc, hc, vc, (s0 * Math.PI) / 180, ((s0 + 338) * Math.PI) / 180).L(tx, ty).Z();
        return one(p, { l: hc * (1 - Math.SQRT1_2), t: vc * (1 - Math.SQRT1_2), r: w - hc * (1 - Math.SQRT1_2), b: h - vc * (1 - Math.SQRT1_2) });
      }
      // insert the pointer into the edge it points away from
      const pts = [[0, 0], [w, 0], [w, h], [0, h]];
      const dx = (tx - hc) / (w || 1);
      const dy = (ty - vc) / (h || 1);
      const inside = tx >= 0 && tx <= w && ty >= 0 && ty <= h;
      if (!inside) {
        if (Math.abs(dy) >= Math.abs(dx)) {
          const bx = clamp(tx, w / 6, (5 * w) / 6);
          if (dy > 0) pts.splice(3, 0, [bx + w / 12, h], [tx, ty], [bx - w / 12, h]);
          else pts.splice(1, 0, [bx - w / 12, 0], [tx, ty], [bx + w / 12, 0]);
        } else {
          const by = clamp(ty, h / 6, (5 * h) / 6);
          if (dx > 0) pts.splice(2, 0, [w, by - h / 12], [tx, ty], [w, by + h / 12]);
          else pts.push([0, by + h / 12], [tx, ty], [0, by - h / 12]);
        }
      }
      return one(P().poly(pts));
    }
    case 'leftBracket': case 'rightBracket': case 'bracketPair': {
      const y1 = (ss * clamp(a('adj'), 0, 50000)) / 100000;
      const left = (x0, x1) => P().M(x1, 0).Q(x0, 0, x0, y1).L(x0, h - y1).Q(x0, h, x1, h);
      if (prst === 'leftBracket') return { paths: [{ d: left(0, w).d, fill: false, stroke: true }], text: { l: w * 0.3, t: 0, r: w, b: h } };
      if (prst === 'rightBracket') return { paths: [{ d: left(w, 0).d, fill: false, stroke: true }], text: { l: 0, t: 0, r: w * 0.7, b: h } };
      return { paths: [{ d: [...left(0, y1).d, ...left(w, w - y1).d], fill: false, stroke: true }], text: { l: y1 * 0.3, t: y1 * 0.3, r: w - y1 * 0.3, b: h - y1 * 0.3 } };
    }
    case 'leftBrace': case 'rightBrace': case 'bracePair': {
      const y1 = (ss * clamp(a(prst === 'bracePair' ? 'adj' : 'adj1'), 0, 25000)) / 100000;
      const c = prst === 'bracePair' ? vc : (h * clamp(a('adj2'), 0, 100000)) / 100000;
      const brace = (xo, xm, xi) => P().M(xo, 0).Q(xm, 0, xm, y1).L(xm, c - y1).Q(xm, c, xi, c).Q(xm, c, xm, c + y1).L(xm, h - y1).Q(xm, h, xo, h);
      if (prst === 'leftBrace') return { paths: [{ d: brace(w, w / 2, 0).d, fill: false, stroke: true }], text: { l: w / 2, t: 0, r: w, b: h } };
      if (prst === 'rightBrace') return { paths: [{ d: brace(0, w / 2, w).d, fill: false, stroke: true }], text: { l: 0, t: 0, r: w / 2, b: h } };
      const bw = Math.min(w / 6, y1 * 2);
      return { paths: [{ d: [...brace(bw, bw / 2, 0).d, ...brace(w - bw, w - bw / 2, w).d], fill: false, stroke: true }], text: { l: bw, t: 0, r: w - bw, b: h } };
    }
    case 'heart': {
      const p = P().M(hc, h / 4).C(hc, 0, 0, 0, 0, h * 0.3).C(0, h * 0.6, hc * 0.7, h * 0.8, hc, h).C(hc * 1.3, h * 0.8, w, h * 0.6, w, h * 0.3).C(w, 0, hc, 0, hc, h / 4).Z();
      return one(p, { l: w * 0.15, t: h * 0.2, r: w * 0.85, b: h * 0.7 });
    }
    default: {
      const star = /^star(\d+)$/.exec(prst || '');
      if (star) {
        const n = Math.min(Number(star[1]), 64); // the preset name is file-supplied ("star99999999")
        const ratio = clamp(a('adj'), 0, 50000) / 50000;
        const pts = [];
        for (let i = 0; i < n * 2; i++) {
          const ang = -Math.PI / 2 + (i * Math.PI) / n;
          const r = i % 2 ? ratio : 1;
          pts.push([hc + hc * r * Math.cos(ang), vc + vc * r * Math.sin(ang)]);
        }
        return one(P().poly(pts), { l: hc * (1 - ratio * 0.8), t: vc * (1 - ratio * 0.8), r: hc * (1 + ratio * 0.8), b: vc * (1 + ratio * 0.8) });
      }
      const callout = /^(?:accent)?(?:border)?(?:accentBorder)?[cC]allout([123])$/.exec(prst || '');
      if (callout) {
        const k = Number(callout[1]);
        const adj = CALLOUT_ADJ[k - 1].map((v, i) => A[`adj${i + 1}`] ?? v);
        const pts = [];
        for (let i = 0; i < adj.length; i += 2) pts.push([(w * adj[i + 1]) / 100000, (h * adj[i]) / 100000]);
        const lead = P();
        pts.forEach(([x, y], i) => (i ? lead.L(x, y) : lead.M(x, y)));
        const border = /[bB]order/.test(prst);
        return { paths: [{ d: P().poly([[0, 0], [w, 0], [w, h], [0, h]]).d, fill: true, stroke: border }, { d: lead.d, fill: false, stroke: true }], text: { l: 0, t: 0, r: w, b: h } };
      }
      if (/^(sun|moon|smileyFace|cloud|cloudCallout|teardrop|noSmoking|flowChartOr|irregularSeal1|irregularSeal2)$/.test(prst || '')) {
        return one(P().ellipse(hc, vc, hc, vc), { l: hc * (1 - Math.SQRT1_2), t: vc * (1 - Math.SQRT1_2), r: w - hc * (1 - Math.SQRT1_2), b: h - vc * (1 - Math.SQRT1_2) });
      }
      return one(P().poly([[0, 0], [w, 0], [w, h], [0, h]]));
    }
  }
}

/** adjust values from an a:avLst / a:gdLst with plain "val N" formulas */
export function adjustValues(prstGeom) {
  const av = {};
  for (const gd of descendants(kid(prstGeom, 'avLst'), 'gd')) {
    const m = /^val\s+(-?\d+(?:\.\d+)?)/.exec(attr(gd, 'fmla') || '');
    if (m) av[attr(gd, 'name')] = Number(m[1]);
  }
  return av;
}

// ------------------------------------------------------------ custom geometry --
const DEG = 60000;
function builtins(w, h) {
  const ss = Math.min(w, h);
  const ls = Math.max(w, h);
  const v = { l: 0, t: 0, r: w, b: h, w, h, hc: w / 2, vc: h / 2, ss, ls, cd2: 10800000, cd4: 5400000, cd8: 2700000, '3cd4': 16200000, '3cd8': 8100000, '5cd8': 13500000, '7cd8': 18900000 };
  for (const n of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32]) { v[`wd${n}`] = w / n; v[`hd${n}`] = h / n; v[`ssd${n}`] = ss / n; }
  return v;
}
function evalFormula(fmla, vars) {
  const [op, ...args] = String(fmla).trim().split(/\s+/);
  const x = args.map((s) => (s in vars ? vars[s] : Number(s) || 0));
  const [a, b, c] = x;
  const rad = (ang) => (ang / DEG) * (Math.PI / 180);
  switch (op) {
    case 'val': return a;
    case '*/': return c ? (a * b) / c : 0;
    case '+-': return a + b - c;
    case '+/': return c ? (a + b) / c : 0;
    case '?:': return a > 0 ? b : c;
    case 'abs': return Math.abs(a);
    case 'at2': return (Math.atan2(b, a) * 180 * DEG) / Math.PI;
    case 'cat2': return a * Math.cos(Math.atan2(c, b));
    case 'cos': return a * Math.cos(rad(b));
    case 'max': return Math.max(a, b);
    case 'min': return Math.min(a, b);
    case 'mod': return Math.sqrt(a * a + b * b + c * c);
    case 'pin': return b < a ? a : b > c ? c : b;
    case 'sat2': return a * Math.sin(Math.atan2(c, b));
    case 'sin': return a * Math.sin(rad(b));
    case 'sqrt': return Math.sqrt(Math.max(0, a));
    case 'tan': return a * Math.tan(rad(b));
    default: return 0;
  }
}

/** a:custGeom -> { paths, text } for a w x h point box. Path coordinates are scaled from each path's own w/h space. */
export function customGeometry(cust, w, h, emu = 12700) {
  const vars = builtins(w * emu, h * emu);
  for (const list of ['avLst', 'gdLst']) for (const gd of kids(kid(cust, list), 'gd')) vars[attr(gd, 'name')] = evalFormula(attr(gd, 'fmla'), vars);
  const val = (s) => (s == null ? 0 : s in vars ? vars[s] : Number(s) || 0);
  const paths = [];
  for (const pe of kids(kid(cust, 'pathLst'), 'path')) {
    const pw = Number(attr(pe, 'w')) || 0;
    const ph = Number(attr(pe, 'h')) || 0;
    const sx = pw ? w / pw : 1 / emu;
    const sy = ph ? h / ph : 1 / emu;
    const p = new Path();
    const pt = (el) => [val(attr(el, 'x')) * sx, val(attr(el, 'y')) * sy];
    for (const c of kids(pe)) {
      const pts = kids(c, 'pt').map(pt);
      if (c.localName === 'moveTo' && pts[0]) p.M(...pts[0]);
      else if (c.localName === 'lnTo' && pts[0]) p.L(...pts[0]);
      else if (c.localName === 'cubicBezTo' && pts.length === 3) p.C(...pts[0], ...pts[1], ...pts[2]);
      else if (c.localName === 'quadBezTo' && pts.length === 2) p.Q(...pts[0], ...pts[1]);
      else if (c.localName === 'arcTo') p.arcTo(val(attr(c, 'wR')) * sx, val(attr(c, 'hR')) * sy, val(attr(c, 'stAng')) / DEG, val(attr(c, 'swAng')) / DEG);
      else if (c.localName === 'close') p.Z();
    }
    if (!p.d.length) continue;
    paths.push({ d: p.d, fill: attr(pe, 'fill') !== 'none', stroke: attr(pe, 'stroke') !== '0' && attr(pe, 'stroke') !== 'false' });
  }
  const rect = kid(cust, 'rect');
  const text = rect
    ? { l: val(attr(rect, 'l')) / emu, t: val(attr(rect, 't')) / emu, r: val(attr(rect, 'r')) / emu, b: val(attr(rect, 'b')) / emu }
    : { l: 0, t: 0, r: w, b: h };
  return { paths, text };
}

/** move/flip shape-local path commands into page coordinates */
export function placePath(d, box, flipH, flipV) {
  const fx = (x) => box.x + (flipH ? box.w - x : x);
  const fy = (y) => box.y + (flipV ? box.h - y : y);
  return d.map((c) => {
    if (c[0] === 'Z') return c;
    const out = [c[0]];
    for (let i = 1; i < c.length; i += 2) out.push(fx(c[i]), fy(c[i + 1]));
    return out;
  });
}
