// Baseline JPEG encoder (4:4:4, standard Annex K tables, AAN float DCT). Pure JS so it runs in browsers;
// used for photographic images extracted from PDFs, which would be several times larger as PNG.
const ZZ = [0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42, 3, 8, 12, 17, 25, 30, 41, 43, 9, 11, 18, 24, 31, 40, 44, 53,
  10, 19, 23, 32, 39, 45, 52, 54, 20, 22, 33, 38, 46, 51, 55, 60, 21, 34, 37, 47, 50, 56, 59, 61, 35, 36, 48, 49, 57, 58, 62, 63];
const YQ = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62,
  18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
const CQ = [17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99,
  ...new Array(32).fill(99)];
const DC_LUM = [[0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]];
const DC_CHR = [[0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]];
const AC_LUM = [[0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d], [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
  0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
  0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
  0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
  0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa]];
const AC_CHR = [[0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 0x77], [
  0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71, 0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91,
  0xa1, 0xb1, 0xc1, 0x09, 0x23, 0x33, 0x52, 0xf0, 0x15, 0x62, 0x72, 0xd1, 0x0a, 0x16, 0x24, 0x34, 0xe1, 0x25, 0xf1, 0x17, 0x18, 0x19, 0x1a, 0x26,
  0x27, 0x28, 0x29, 0x2a, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58,
  0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
  0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4,
  0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda,
  0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa]];
const AAN = [1.0, 1.387039845, 1.306562965, 1.175875602, 1.0, 0.785694958, 0.5411961, 0.275899379];

function huff([counts, values]) {
  const t = [];
  let code = 0;
  let k = 0;
  for (let len = 1; len <= 16; len++) {
    for (let i = 0; i < counts[len - 1]; i++) t[values[k++]] = [code++, len];
    code <<= 1;
  }
  return t;
}
const H = { dcY: huff(DC_LUM), acY: huff(AC_LUM), dcC: huff(DC_CHR), acC: huff(AC_CHR) };

function tables(quality) {
  const q = Math.max(1, Math.min(100, quality));
  const sf = q < 50 ? 5000 / q : 200 - q * 2;
  const make = (base) => {
    const zq = new Uint8Array(64); // zig-zag order, for the DQT segment
    const div = new Float64Array(64); // natural order: 1 / (quant * AAN scale * 8)
    for (let n = 0; n < 64; n++) {
      const v = Math.max(1, Math.min(255, Math.floor((base[n] * sf + 50) / 100)));
      zq[ZZ[n]] = v;
      div[n] = 1 / (v * AAN[n >> 3] * AAN[n & 7] * 8);
    }
    return { zq, div };
  };
  return { y: make(YQ), c: make(CQ) };
}

function fdct(d) {
  for (let s = 0; s < 2; s++) {
    const step = s ? 8 : 1; // rows, then columns
    for (let r = 0; r < 8; r++) {
      const o = s ? r : r * 8;
      const p = (i) => o + i * step;
      const t0 = d[p(0)] + d[p(7)]; const t7 = d[p(0)] - d[p(7)];
      const t1 = d[p(1)] + d[p(6)]; const t6 = d[p(1)] - d[p(6)];
      const t2 = d[p(2)] + d[p(5)]; const t5 = d[p(2)] - d[p(5)];
      const t3 = d[p(3)] + d[p(4)]; const t4 = d[p(3)] - d[p(4)];
      let t10 = t0 + t3; const t13 = t0 - t3; let t11 = t1 + t2; let t12 = t1 - t2;
      d[p(0)] = t10 + t11; d[p(4)] = t10 - t11;
      const z1 = (t12 + t13) * 0.707106781;
      d[p(2)] = t13 + z1; d[p(6)] = t13 - z1;
      t10 = t4 + t5; t11 = t5 + t6; t12 = t6 + t7;
      const z5 = (t10 - t12) * 0.382683433;
      const z2 = 0.5411961 * t10 + z5;
      const z4 = 1.306562965 * t12 + z5;
      const z3 = t11 * 0.707106781;
      const z11 = t7 + z3; const z13 = t7 - z3;
      d[p(5)] = z13 + z2; d[p(3)] = z13 - z2; d[p(1)] = z11 + z4; d[p(7)] = z11 - z4;
    }
  }
}

/** pixels: RGBA (channels 4), RGB (3) or grey (1), row-major. Returns JPEG bytes. */
export function encodeJpeg(width, height, pixels, channels, quality = 85) {
  const T = tables(quality);
  let out = new Uint8Array(Math.max(4096, width * height));
  let len = 0;
  const byte = (b) => {
    if (len >= out.length) { const n = new Uint8Array(out.length * 2); n.set(out); out = n; }
    out[len++] = b;
  };
  const word = (w) => { byte(w >> 8); byte(w & 255); };
  let acc = 0;
  let nbits = 0;
  const bits = ([code, n]) => {
    acc = (acc << n) | code;
    nbits += n;
    while (nbits >= 8) {
      const b = (acc >> (nbits - 8)) & 255;
      byte(b);
      if (b === 255) byte(0);
      nbits -= 8;
      acc &= (1 << nbits) - 1;
    }
  };
  const cat = (v) => { const a = Math.abs(v); let n = 0; while ((1 << n) <= a) n++; return [v < 0 ? v + (1 << n) - 1 : v, n]; };
  // headers
  word(0xffd8);
  word(0xffe0); word(16); [0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0].forEach(byte);
  word(0xffdb); word(132); byte(0); T.y.zq.forEach(byte); byte(1); T.c.zq.forEach(byte);
  word(0xffc0); word(17); byte(8); word(height); word(width); byte(3);
  [[1, 0], [2, 1], [3, 1]].forEach(([id, q]) => { byte(id); byte(0x11); byte(q); });
  word(0xffc4);
  word(2 + [DC_LUM, AC_LUM, DC_CHR, AC_CHR].reduce((a, t) => a + 17 + t[1].length, 0));
  [[0x00, DC_LUM], [0x10, AC_LUM], [0x01, DC_CHR], [0x11, AC_CHR]].forEach(([id, [counts, values]]) => { byte(id); counts.forEach(byte); values.forEach(byte); });
  word(0xffda); word(12); byte(3); [[1, 0x00], [2, 0x11], [3, 0x11]].forEach(([id, t]) => { byte(id); byte(t); }); byte(0); byte(63); byte(0);
  // scan
  const Y = new Float64Array(64);
  const U = new Float64Array(64);
  const V = new Float64Array(64);
  const DU = new Int32Array(64);
  const prev = [0, 0, 0];
  const block = (d, t, dc, ac, ci) => {
    fdct(d);
    for (let n = 0; n < 64; n++) DU[ZZ[n]] = Math.round(d[n] * t.div[n]);
    const diff = DU[0] - prev[ci];
    prev[ci] = DU[0];
    if (diff === 0) bits(dc[0]);
    else { const [v, n] = cat(diff); bits(dc[n]); bits([v, n]); }
    let end = 63;
    while (end > 0 && DU[end] === 0) end--;
    for (let i = 1; i <= end; i++) {
      let zeros = 0;
      while (DU[i] === 0 && i <= end) { zeros++; i++; }
      while (zeros >= 16) { bits(ac[0xf0]); zeros -= 16; }
      const [v, n] = cat(DU[i]);
      bits(ac[(zeros << 4) + n]);
      bits([v, n]);
    }
    if (end !== 63) bits(ac[0]);
  };
  for (let by = 0; by < height; by += 8) {
    for (let bx = 0; bx < width; bx += 8) {
      for (let r = 0; r < 8; r++) {
        const y = Math.min(height - 1, by + r);
        for (let c = 0; c < 8; c++) {
          const x = Math.min(width - 1, bx + c);
          const i = (y * width + x) * channels;
          const R = pixels[i];
          const G = channels >= 3 ? pixels[i + 1] : R;
          const B = channels >= 3 ? pixels[i + 2] : R;
          const n = r * 8 + c;
          Y[n] = 0.299 * R + 0.587 * G + 0.114 * B - 128;
          U[n] = -0.16874 * R - 0.33126 * G + 0.5 * B;
          V[n] = 0.5 * R - 0.41869 * G - 0.08131 * B;
        }
      }
      block(Y, T.y, H.dcY, H.acY, 0);
      block(U, T.c, H.dcC, H.acC, 1);
      block(V, T.c, H.dcC, H.acC, 2);
    }
  }
  if (nbits > 0) bits([(1 << (8 - nbits)) - 1, 8 - nbits]);
  word(0xffd9);
  return out.slice(0, len);
}
