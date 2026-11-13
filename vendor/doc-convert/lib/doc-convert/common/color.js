// Colour helpers shared by the spreadsheet and slide readers.
import { kid, kids, attr, descendants } from './xml.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
export function hexToRgb(h) {
  const s = String(h).replace('#', '');
  return [parseInt(s.slice(0, 2), 16) / 255, parseInt(s.slice(2, 4), 16) / 255, parseInt(s.slice(4, 6), 16) / 255];
}
export const rgbToHex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

function rgbToHsl([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToRgb([h, s, l]) {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}

/** SpreadsheetML tint (-1..1) applied to luminance */
export function applyTint(hex, tint) {
  if (!tint) return hex;
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  const l2 = tint < 0 ? l * (1 + tint) : l * (1 - tint) + tint;
  return rgbToHex(hslToRgb([h, s, clamp01(l2)]));
}

// sRGB <-> linear light. DrawingML applies tint/shade in linear RGB (PowerPoint and LibreOffice agree:
// "tx1 + tint 75%" on black is a mid grey #898989, not the #404040 a plain sRGB mix would give).
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/** DrawingML colour transforms on an <a:srgbClr>/<a:schemeClr>/... element (tint, shade, lumMod, lumOff, satMod, hueMod, alpha, ...) */
export function applyDrawingMods(hex, el, alpha0 = 1) {
  let rgb = hexToRgb(hex);
  let alpha = alpha0;
  for (const m of kids(el)) {
    const raw = Number(attr(m, 'val'));
    const v = raw / 100000;
    switch (m.localName) {
      case 'tint': rgb = rgb.map((c) => toSrgb(toLin(c) * v + (1 - v))); break;
      case 'shade': rgb = rgb.map((c) => toSrgb(toLin(c) * v)); break;
      case 'lumMod': case 'lumOff': case 'satMod': case 'satOff': case 'hueMod': case 'hueOff': case 'sat': case 'lum': case 'hue': {
        let [h, s, l] = rgbToHsl(rgb);
        if (m.localName === 'lumMod') l *= v;
        else if (m.localName === 'lumOff') l += v;
        else if (m.localName === 'lum') l = v;
        else if (m.localName === 'satMod') s *= v;
        else if (m.localName === 'satOff') s += v;
        else if (m.localName === 'sat') s = v;
        else if (m.localName === 'hueMod') h = (h * v) % 1;
        else if (m.localName === 'hueOff') h = (((h + raw / 21600000) % 1) + 1) % 1;
        else h = raw / 21600000;
        rgb = hslToRgb([h, clamp01(s), clamp01(l)]);
        break;
      }
      case 'gray': { const y = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; rgb = [y, y, y]; break; }
      case 'inv': rgb = rgb.map((c) => 1 - c); break;
      case 'comp': { const [h, s, l] = rgbToHsl(rgb); rgb = hslToRgb([(h + 0.5) % 1, s, l]); break; }
      case 'alpha': alpha = v; break;
      case 'alphaMod': alpha *= v; break;
      case 'alphaOff': alpha = clamp01(alpha + v); break;
      default: break;
    }
  }
  return { color: rgbToHex(rgb), alpha };
}

const PRESET = {
  black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF', yellow: 'FFFF00', cyan: '00FFFF', magenta: 'FF00FF',
  gray: '808080', grey: '808080', silver: 'C0C0C0', maroon: '800000', navy: '000080', olive: '808000', purple: '800080', teal: '008080',
  orange: 'FFA500', lime: '00FF00', darkGray: 'A9A9A9', lightGray: 'D3D3D3', dkGray: 'A9A9A9', ltGray: 'D3D3D3', darkBlue: '00008B',
  darkRed: '8B0000', darkGreen: '006400', lightBlue: 'ADD8E6', gold: 'FFD700', pink: 'FFC0CB', brown: 'A52A2A',
};
const COLOR_ELS = ['srgbClr', 'schemeClr', 'sysClr', 'prstClr', 'scrgbClr', 'hslClr'];

/** first DrawingML colour child of el (a:solidFill, a:fgClr, a:buClr, ...) */
export function colorChild(el) {
  for (const c of kids(el)) if (COLOR_ELS.includes(c.localName)) return c;
  return null;
}

/**
 * Resolve a DrawingML colour element to { color: '#RRGGBB', alpha }.
 * env: { theme, map (clrMap: tx1 -> dk1 ...), ph ({color, alpha} substituted for phClr) }
 */
export function dmlColor(el, env) {
  if (!el) return null;
  let base;
  let alpha = 1;
  switch (el.localName) {
    case 'srgbClr': base = '#' + (attr(el, 'val') || '000000'); break;
    case 'sysClr': base = '#' + (attr(el, 'lastClr') || (attr(el, 'val') === 'window' ? 'FFFFFF' : '000000')); break;
    case 'prstClr': base = '#' + (PRESET[attr(el, 'val')] || '000000'); break;
    case 'scrgbClr': base = rgbToHex(['r', 'g', 'b'].map((k) => toSrgb(clamp01(Number(attr(el, k)) / 100000)))); break;
    case 'hslClr': base = rgbToHex(hslToRgb([Number(attr(el, 'hue')) / 21600000, Number(attr(el, 'sat')) / 100000, Number(attr(el, 'lum')) / 100000])); break;
    case 'schemeClr': {
      const v = attr(el, 'val');
      if (v === 'phClr') {
        if (!env.ph) return null;
        base = env.ph.color;
        alpha = env.ph.alpha ?? 1;
      } else {
        const key = env.map?.[v] || { tx1: 'dk1', bg1: 'lt1', tx2: 'dk2', bg2: 'lt2' }[v] || v;
        base = env.theme[key] || env.theme[v] || '#000000';
      }
      break;
    }
    default: return null;
  }
  if (!/^#[0-9a-f]{6}$/i.test(base)) base = '#000000';
  return applyDrawingMods(base, el, alpha);
}

export const INDEXED = [
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF', '000000', 'FFFFFF', 'FF0000', '00FF00',
  '0000FF', 'FFFF00', 'FF00FF', '00FFFF', '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080',
  '9999FF', '993366', 'FFFFCC', 'CCFFFF', '660066', 'FF8080', '0066CC', 'CCCCFF', '000080', 'FF00FF', 'FFFF00', '00FFFF',
  '800080', '800000', '008080', '0000FF', '00CCFF', 'CCFFFF', 'CCFFCC', 'FFFF99', '99CCFF', 'FF99CC', 'CC99FF', 'FFCC99',
  '3366FF', '33CCCC', '99CC00', 'FFCC00', 'FF9900', 'FF6600', '666699', '969696', '003366', '339966', '003300', '333300',
  '993300', '993366', '333399', '333333',
].map((h) => '#' + h);

/** Theme colours + fonts from theme1.xml (DrawingML). */
export function parseThemePart(doc) {
  const t = {
    dk1: '#000000', lt1: '#FFFFFF', dk2: '#44546A', lt2: '#E7E6E6', accent1: '#4472C4', accent2: '#ED7D31', accent3: '#A5A5A5',
    accent4: '#FFC000', accent5: '#5B9BD5', accent6: '#70AD47', hlink: '#0563C1', folHlink: '#954F72', major: 'Calibri Light', minor: 'Calibri',
  };
  if (!doc) return t;
  const scheme = descendants(doc.documentElement, 'clrScheme')[0];
  for (const el of kids(scheme)) {
    const c = kid(el, 'srgbClr') || kid(el, 'sysClr');
    const v = c && (attr(c, 'lastClr') || attr(c, 'val'));
    if (v && /^[0-9a-f]{6}$/i.test(v)) t[el.localName] = '#' + v.toUpperCase();
  }
  for (const key of ['major', 'minor']) {
    const f = descendants(doc.documentElement, key + 'Font')[0];
    const latin = kid(f, 'latin');
    if (latin && attr(latin, 'typeface')) t[key] = attr(latin, 'typeface');
  }
  return t;
}
