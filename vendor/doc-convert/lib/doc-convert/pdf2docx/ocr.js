// OCR of scanned pages: which pages count as scanned, the image handed to the caller's ocr() function, and
// its result turned into the same glyph records extract.js makes from PDF text. The OCR engine itself is the
// caller's (convert({ ocr })); results are treated as untrusted input like the PDF itself.
import { encodePng } from '../common/png.js';

export const OCR = {
  // a page is scanned when it has fewer glyphs than this and its largest image covers at least `minCover`
  // of it (pictures of text that fill a third of a slide count; a photo among them fails the confidence test)
  scanMaxGlyphs: 20,
  minCover: 0.25,
  // accepting a result: words below `minWordConfidence` are dropped; the page is read when at least
  // `minWords` remain and their mean confidence is at least `minMeanConfidence` (all 0-100)
  minWordConfidence: 30,
  minWords: 5,
  minMeanConfidence: 55,
  // caps on one page's result: lines and words looked at, characters kept (a dense page has ~5000)
  maxLines: 2000,
  maxWordsExamined: 20000,
  maxPageGlyphs: 20000,
  maxWordChars: 64,
};

/** index of the page's largest image (by area on the page) when it makes the page a scan, or -1 */
export function findScan(glyphs, images, width, height) {
  if (glyphs.length >= OCR.scanMaxGlyphs || !images.length) return -1;
  const area = width * height;
  let best = -1;
  let bestCover = 0;
  images.forEach((im, k) => {
    const w = Math.min(im.x1, width) - Math.max(im.x0, 0);
    const h = Math.min(im.y1, height) - Math.max(im.y0, 0);
    const cover = w > 0 && h > 0 ? (w * h) / area : 0;
    if (cover >= OCR.minCover && cover > bestCover) { best = k; bestCover = cover; }
  });
  return best;
}

/**
 * How image pixels map to the page, from the image's transform (unit square -> page, y down): 'normal' or
 * 'swap' (rotated by 90/270 degrees), with the flips; null when the image is skewed or rotated otherwise.
 */
export function orientation(m) {
  const [a, b, c, d] = m;
  const s = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));
  if (!(s > 0) || !m.every(Number.isFinite)) return null;
  const eps = s * 1e-3;
  if (Math.abs(b) <= eps && Math.abs(c) <= eps) return { swap: false, flipX: a < 0, flipY: d > 0 };
  if (Math.abs(a) <= eps && Math.abs(d) <= eps) return { swap: true, flipX: c < 0, flipY: b < 0 };
  return null;
}

/**
 * Decoded pixels ({ pixels, width, height, channels }) -> a grey PNG as the image appears on the page
 * (upright, unflipped), box-filtered down to at most maxPixels.
 * @returns { bytes, format: 'png', width, height } or null
 */
export function ocrImage(px, m, maxPixels) {
  const o = orientation(m);
  if (!o) return null;
  const { pixels, width: w, height: h, channels } = px;
  const W = o.swap ? h : w; // display size at source resolution
  const H = o.swap ? w : h;
  const f = Math.max(1, Math.ceil(Math.sqrt((W * H) / maxPixels)));
  const ow = Math.floor(W / f);
  const oh = Math.floor(H / f);
  if (ow < 1 || oh < 1) return null;
  // source pixel index = offX[X] + offY[Y] for display pixel (X, Y)
  const offX = new Float64Array(ow * f);
  const offY = new Float64Array(oh * f);
  for (let X = 0; X < offX.length; X++) {
    const t = o.flipX ? W - 1 - X : X;
    offX[X] = o.swap ? (h - 1 - t) * w : t; // rotated: display x runs along source rows (bottom to top)
  }
  for (let Y = 0; Y < offY.length; Y++) {
    const t = o.flipY ? H - 1 - Y : Y;
    offY[Y] = o.swap ? t : t * w;
  }
  const out = new Uint8Array(ow * oh);
  const ff = f * f;
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      let sum = 0;
      for (let dy = 0; dy < f; dy++) {
        const oy = offY[y * f + dy];
        for (let dx = 0; dx < f; dx++) {
          const i = offX[x * f + dx] + oy;
          if (channels === 1) sum += pixels[i];
          else {
            const p = i * channels;
            const g = (pixels[p] * 77 + pixels[p + 1] * 150 + pixels[p + 2] * 29) >> 8;
            sum += channels === 4 ? 255 - ((255 - g) * pixels[p + 3]) / 255 : g; // alpha: over white
          }
        }
      }
      out[y * ow + x] = sum / ff;
    }
  }
  return { bytes: encodePng(ow, oh, out, 1), format: 'png', width: ow, height: oh };
}

// characters that must not reach the writers: controls, whitespace inside a word, unpaired surrogates (a
// valid pair is one code point, so a lone half is a one-unit string here) and non-characters
const JUNK = /^[\u0000-\u0020\u007f-\u00a0\u2000-\u200f\u2028-\u202f\u205f-\u206f\u3000\ud800-\udfff\ufeff\ufff0-\uffff]$/;
const num = (v) => (typeof v === 'number' ? v : NaN);

/**
 * An ocr() result for an image of `img.width` x `img.height` pixels placed at `box` (page units) -> glyph
 * records, or null when the result is missing, malformed or not confident enough.
 */
export function ocrGlyphs(result, img, box) {
  const lines = result && Array.isArray(result.lines) ? result.lines : null;
  if (!lines) return null;
  const { width, height } = img;
  let examined = 0;
  let total = 0;
  let confSum = 0;
  let chars = 0;
  const kept = [];
  for (let i = 0; i < Math.min(lines.length, OCR.maxLines) && examined < OCR.maxWordsExamined && chars < OCR.maxPageGlyphs; i++) {
    const words = Array.isArray(lines[i]?.words) ? lines[i].words : [];
    const line = [];
    for (let j = 0; j < words.length && examined < OCR.maxWordsExamined && chars < OCR.maxPageGlyphs; j++) {
      examined++;
      const wd = words[j];
      const conf = num(wd?.confidence);
      if (!(conf >= OCR.minWordConfidence && conf <= 100)) continue; // NaN, negative, too low
      const bb = wd.bbox;
      const x0 = Math.max(0, num(bb?.x0));
      const y0 = Math.max(0, num(bb?.y0));
      const x1 = Math.min(width, num(bb?.x1));
      const y1 = Math.min(height, num(bb?.y1));
      if (!(x1 > x0 && y1 > y0)) continue; // NaN, empty or outside the image
      const text = Array.from(typeof wd.text === 'string' ? wd.text.slice(0, 4 * OCR.maxWordChars) : '').filter((ch) => !JUNK.test(ch)).slice(0, OCR.maxWordChars);
      if (!text.length) continue;
      line.push({ text, x0, y0, x1, y1 });
      chars += text.length + 1;
      total++;
      confSum += conf;
    }
    if (line.length) kept.push(line);
  }
  if (total < OCR.minWords || confSum / total < OCR.minMeanConfidence) return null;

  const sx = (box.x1 - box.x0) / width;
  const sy = (box.y1 - box.y0) / height;
  const heights = kept.map((ln) => Math.max(...ln.map((w) => w.y1)) - Math.min(...ln.map((w) => w.y0)));
  const typical = [...heights].sort((a, b) => a - b)[heights.length >> 1];
  const glyphs = [];
  const glyph = (ch, x0, x1, y, size) => ({
    ch, x0, x1, y, size, family: 'Arial', bold: false, italic: false, fontRaw: 'OCR', ascent: 0.905, descent: -0.212,
    color: '#000000', space: ch === ' ', artifact: false, invisible: false, rotated: false,
  });
  kept.forEach((ln, k) => {
    // one size for ordinary lines (a line without ascenders or descenders is shorter but not smaller text);
    // a line box spans ascender to descender, about 0.95 of the font size
    const hPx = Math.abs(heights[k] - typical) <= 0.3 * typical ? typical : heights[k];
    const size = Math.max(3, Math.min(144, (hPx * sy) / 0.95));
    // baseline: most words have no descender, so the median word bottom
    const bottoms = ln.map((w) => w.y1).sort((a, b) => a - b);
    const y = box.y0 + bottoms[bottoms.length >> 1] * sy;
    ln.sort((a, b) => a.x0 - b.x0);
    let prevX1 = null;
    for (const w of ln) {
      const x0 = box.x0 + w.x0 * sx;
      const x1 = box.x0 + w.x1 * sx;
      if (prevX1 !== null && x0 > prevX1) glyphs.push(glyph(' ', prevX1, x0, y, size));
      const cw = (x1 - x0) / w.text.length;
      w.text.forEach((ch, c) => glyphs.push(glyph(ch, x0 + c * cw, x0 + (c + 1) * cw, y, size)));
      prevX1 = Math.max(prevX1 ?? x1, x1);
    }
  });
  return glyphs;
}
