// Minimal PNG encoder (RGBA/RGB/gray -> PNG) on top of fflate, so it runs in browsers too.
import { zlibSync } from 'fflate';
import { inflateStream } from './inflate.js';
import { DEFAULT_LIMITS } from './limits.js';

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** channels: 1 (gray), 3 (RGB) or 4 (RGBA) */
export function encodePng(width, height, pixels, channels) {
  const colorType = { 1: 0, 3: 2, 4: 6 }[channels];
  const stride = width * channels;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    raw.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlibSync(raw, { level: 6 })),
    chunk('IEND', new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** bytes of filtered scanlines a PNG decoder needs: (rowBytes + 1) per row, per Adam7 pass when interlaced */
function rawSize(w, h, bitsPerPixel, interlaced) {
  const rows = (pw, ph) => (pw && ph ? (Math.ceil((pw * bitsPerPixel) / 8) + 1) * ph : 0);
  if (!interlaced) return rows(w, h);
  // Adam7: [x0, y0, dx, dy] per pass
  const P = [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]];
  return P.reduce((a, [x0, y0, dx, dy]) => a + rows(Math.ceil((w - x0) / dx), Math.ceil((h - y0) / dy)), 0);
}

/**
 * Is this PNG safe to hand to pdfkit? pdfkit decodes PNGs with transparency (or interlacing) through an
 * asynchronous zlib callback that *throws* on corrupt data, which no try/catch can intercept and which
 * takes the whole process down. So check those images synchronously first: chunk structure, a clean
 * inflate of the image data and its zlib checksum. Opaque, non-interlaced PNGs are embedded as-is.
 *
 * The inflate is bounded by the size the IHDR implies (a decompression bomb - an 8x8 image whose IDAT
 * inflates to 1.2 GB - is refused after the first few MB) and runs as a stream that keeps only the running
 * checksum, so checking costs no memory. pdfkit then needs ~10 bytes per pixel to decode, so the pixel
 * count is capped too (limits.maxDecodedPngPixels). A PNG that fails is drawn as a placeholder box by
 * render.js and never reaches pdfkit.
 */
export function pngIsSafe(bytes, limits = DEFAULT_LIMITS) {
  if (!bytes || bytes.length < 33 || SIG.some((v, i) => bytes[i] !== v)) return false;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let p = 8;
  let ihdr = null;
  let trns = false;
  const idat = [];
  let total = 0;
  while (p + 12 <= bytes.length) {
    const len = dv.getUint32(p);
    const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
    if (len > bytes.length - p - 12) return false;
    if (type === 'IHDR') ihdr = { w: dv.getUint32(p + 8), h: dv.getUint32(p + 12), depth: bytes[p + 16], color: bytes[p + 17], interlace: bytes[p + 20] };
    else if (type === 'tRNS') trns = true;
    else if (type === 'IDAT') { idat.push(bytes.subarray(p + 8, p + 8 + len)); total += len; }
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (!ihdr || !idat.length || !ihdr.w || !ihdr.h) return false;
  const decodes = ihdr.color === 4 || ihdr.color === 6 || trns || ihdr.interlace === 1;
  if (!decodes) return true;
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.color];
  if (!channels || ![1, 2, 4, 8, 16].includes(ihdr.depth)) return false;
  if (ihdr.w * ihdr.h > limits.maxDecodedPngPixels) return false; // pdfkit would need ~10 bytes per pixel
  const want = rawSize(ihdr.w, ihdr.h, channels * ihdr.depth, ihdr.interlace === 1);
  const z = new Uint8Array(total);
  let o = 0;
  for (const c of idat) { z.set(c, o); o += c.length; }
  if (z.length < 6 || (z[0] & 0x0f) !== 8 || ((z[0] << 8) | z[1]) % 31 !== 0) return false;
  try {
    // running Adler-32 over the stream (same arithmetic as adler32(), chunk by chunk)
    let a = 1;
    let b = 0;
    const got = inflateStream(z.subarray(2, z.length - 4), want, (buf) => {
      for (let i = 0; i < buf.length;) {
        const end = Math.min(buf.length, i + 3800);
        for (; i < end; i++) { a += buf[i]; b += a; }
        a %= 65521;
        b %= 65521;
      }
    }, 'PNG image data');
    const sum = ((z[z.length - 4] << 24) | (z[z.length - 3] << 16) | (z[z.length - 2] << 8) | z[z.length - 1]) >>> 0;
    if ((((b << 16) | a) >>> 0) !== sum) return false;
    return ihdr.interlace === 1 || got >= want;
  } catch {
    return false; // corrupt, or more data than the IHDR allows
  }
}

/** pixel size of a PNG or JPEG ({ w, h, dpi }), or null */
export function imageSize(bytes) {
  if (!bytes || bytes.length < 24) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    let dpi = 96;
    for (let p = 8; p + 12 <= bytes.length;) {
      const len = dv.getUint32(p);
      const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
      if (type === 'pHYs' && bytes[p + 16] === 1) dpi = Math.round(dv.getUint32(p + 8) * 0.0254) || 96;
      if (type === 'IDAT' || type === 'IEND') break;
      p += 12 + len;
    }
    return { w: dv.getUint32(16), h: dv.getUint32(20), dpi };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let dpi = 96;
    for (let p = 2; p + 9 < bytes.length;) {
      if (bytes[p] !== 0xff) { p++; continue; }
      const m = bytes[p + 1];
      const len = dv.getUint16(p + 2);
      if (m === 0xe0 && bytes[p + 4] === 0x4a && bytes[p + 11] === 1) dpi = dv.getUint16(p + 12) || 96;
      if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) return { w: dv.getUint16(p + 7), h: dv.getUint16(p + 5), dpi };
      p += 2 + len;
    }
  }
  return null;
}
