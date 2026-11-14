import { boxMean, computeDepth, computeMatte, loadImage, makeCanvas, resizeBilinear, type Progress, type SubjectMode } from './matting'

// Portrait-style background blur:
//  1. subject matte (matting.ts)
//  2. fill the subject area with the surrounding background colours (push-pull), so the subject's colours
//     cannot bleed into the blurred background (no halo)
//  3. lens blur: gather over a disc (golden-angle samples), bright pixels weighted up so highlights become bokeh
//     balls; optional per-pixel radius from a depth map (blur grows with distance from the subject)
//  4. composite the sharp, full-resolution subject over the upscaled blurred background
// ponytail: blur runs at <=1280px with a disc radius <=10px then is upscaled; blur is smooth so nothing visible is lost.

export type LensOptions = { subject: SubjectMode; depth: boolean; progress?: Progress }
export type LensInfo = { mode: 'person' | 'any'; backend: string; depth: boolean; depthFailed: boolean }

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

function half(src: Float32Array, w: number, h: number, ch: number) {
  const nw = Math.ceil(w / 2), nh = Math.ceil(h / 2)
  const out = new Float32Array(nw * nh * ch)
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    const x1 = Math.min(w - 1, 2 * x + 1), y1 = Math.min(h - 1, 2 * y + 1)
    for (let c = 0; c < ch; c++) {
      out[(y * nw + x) * ch + c] = (src[(2 * y * w + 2 * x) * ch + c] + src[(2 * y * w + x1) * ch + c] + src[(y1 * w + 2 * x) * ch + c] + src[(y1 * w + x1) * ch + c]) / 4
    }
  }
  return { data: out, w: nw, h: nh }
}

// Fill pixels where weight is ~0 with colours pulled from nearby weight-1 pixels. rgb is interleaved, 0..1.
function pushPull(rgb: Float32Array, wt: Float32Array, w: number, h: number) {
  const C: Float32Array[] = [], Wt: Float32Array[] = [], dims: number[][] = [[w, h]]
  const pm = new Float32Array(w * h * 3)
  for (let i = 0; i < w * h; i++) for (let c = 0; c < 3; c++) pm[i * 3 + c] = rgb[i * 3 + c] * wt[i]
  C.push(pm); Wt.push(wt)
  while (dims[dims.length - 1][0] > 1 || dims[dims.length - 1][1] > 1) {
    const [lw, lh] = dims[dims.length - 1]
    const c = half(C[C.length - 1], lw, lh, 3), k = half(Wt[Wt.length - 1], lw, lh, 1)
    C.push(c.data); Wt.push(k.data); dims.push([c.w, c.h])
  }
  const top = dims.length - 1
  let cur = new Float32Array(3)
  for (let c = 0; c < 3; c++) cur[c] = Wt[top][0] > 1e-4 ? C[top][c] / Wt[top][0] : 0.5
  for (let l = top - 1; l >= 0; l--) {
    const [lw, lh] = dims[l], [uw, uh] = dims[l + 1]
    const up = new Float32Array(lw * lh * 3)
    for (let c = 0; c < 3; c++) {
      const plane = new Float32Array(uw * uh)
      for (let i = 0; i < plane.length; i++) plane[i] = cur[i * 3 + c]
      const r = resizeBilinear(plane, uw, uh, lw, lh)
      for (let i = 0; i < r.length; i++) up[i * 3 + c] = r[i]
    }
    for (let i = 0; i < lw * lh; i++) {
      const wv = Wt[l][i], a = Math.min(1, wv * 2)
      for (let c = 0; c < 3; c++) up[i * 3 + c] = a * (wv > 1e-4 ? C[l][i * 3 + c] / wv : 0) + (1 - a) * up[i * 3 + c]
    }
    cur = up
  }
  return cur
}

function lensBlur(src: Float32Array, rad: Float32Array, w: number, h: number) {
  const out = new Float32Array(w * h * 3)
  const N = 64
  const GA = 2.39996323
  const sx = new Float32Array(N), sy = new Float32Array(N)
  for (let i = 0; i < N; i++) { const rr = Math.sqrt((i + 0.5) / N); sx[i] = Math.cos(i * GA) * rr; sy[i] = Math.sin(i * GA) * rr }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, r = rad[p]
    if (r < 0.4) { for (let c = 0; c < 3; c++) out[p * 3 + c] = src[p * 3 + c]; continue }
    const rot = 6.2831853 * ((52.9829189 * ((0.06711056 * x + 0.00583715 * y) % 1)) % 1) // interleaved gradient noise
    const cs = Math.cos(rot), sn = Math.sin(rot)
    let R = 0, G = 0, B = 0, S = 0
    for (let i = 0; i < N; i++) {
      const ox = (sx[i] * cs - sy[i] * sn) * r, oy = (sx[i] * sn + sy[i] * cs) * r
      const qx = Math.min(w - 1, Math.max(0, Math.round(x + ox))), qy = Math.min(h - 1, Math.max(0, Math.round(y + oy)))
      const q = (qy * w + qx) * 3
      const lum = 0.299 * src[q] + 0.587 * src[q + 1] + 0.114 * src[q + 2]
      const hl = lum > 0.78 ? (lum - 0.78) / 0.22 : 0
      const wgt = 1 + 9 * hl * hl // bokeh: highlights weigh more
      R += src[q] * wgt; G += src[q + 1] * wgt; B += src[q + 2] * wgt; S += wgt
    }
    out[p * 3] = R / S; out[p * 3 + 1] = G / S; out[p * 3 + 2] = B / S
  }
  return out
}

export async function blurBackgroundLens(file: File, radius: number, opt: LensOptions): Promise<{ blob: Blob; info: LensInfo }> {
  const img = await loadImage(file)
  const W = img.naturalWidth, H = img.naturalHeight, L = Math.max(W, H)
  const matte = await computeMatte(img, file, opt.subject, opt.progress)
  opt.progress?.('Blurring background')
  await new Promise(r => setTimeout(r, 0)) // let the status paint before the heavy loop

  // aperture: slider 50 = disc radius of 4% of the long side
  const rmax = (radius / 50) * 0.04 * L
  const sb = Math.max(64 / L, Math.min(1, 1280 / L, 10 / Math.max(rmax, 0.01)))
  const bw = Math.max(1, Math.round(W * sb)), bh = Math.max(1, Math.round(H * sb))
  const rmaxB = rmax * sb

  const small = makeCanvas(bw, bh).getContext('2d', { willReadFrequently: true })!
  small.imageSmoothingQuality = 'high'
  small.drawImage(img, 0, 0, bw, bh)
  const px = small.getImageData(0, 0, bw, bh).data
  const rgb = new Float32Array(bw * bh * 3)
  for (let i = 0; i < bw * bh; i++) for (let c = 0; c < 3; c++) rgb[i * 3 + c] = px[i * 4 + c] / 255

  const m = resizeBilinear(matte.alpha, matte.w, matte.h, bw, bh)
  const grown = boxMean(m, bw, bh, Math.max(2, Math.round(Math.max(bw, bh) / 250)))
  const wt = new Float32Array(bw * bh)
  for (let i = 0; i < wt.length; i++) wt[i] = 1 - Math.min(1, grown[i] * 8)
  const filled = pushPull(rgb, wt, bw, bh)
  const base = new Float32Array(rgb.length)
  for (let i = 0; i < wt.length; i++) for (let c = 0; c < 3; c++) base[i * 3 + c] = wt[i] * rgb[i * 3 + c] + (1 - wt[i]) * filled[i * 3 + c]

  const rad = new Float32Array(bw * bh).fill(rmaxB)
  let depthUsed = false, depthFailed = false
  if (opt.depth) {
    try {
      const d = await computeDepth(img, bw, bh, opt.progress)
      let s = 0, n = 0
      for (let i = 0; i < d.length; i++) if (m[i] > 0.5) { s += d[i]; n++ }
      const df = n ? s / n : 0.5
      const sm = boxMean(d, bw, bh, 2)
      for (let i = 0; i < rad.length; i++) rad[i] = rmaxB * (0.35 + 0.65 * smooth(0.05, 0.45, Math.abs(sm[i] - df)))
      depthUsed = true
      opt.progress?.('Blurring background')
    } catch { depthFailed = true }
  }

  const blurred = lensBlur(base, rad, bw, bh)
  const bc = makeCanvas(bw, bh)
  const bctx = bc.getContext('2d')!
  const bd = bctx.createImageData(bw, bh)
  for (let i = 0; i < bw * bh; i++) {
    bd.data[i * 4] = blurred[i * 3] * 255; bd.data[i * 4 + 1] = blurred[i * 3 + 1] * 255; bd.data[i * 4 + 2] = blurred[i * 3 + 2] * 255; bd.data[i * 4 + 3] = 255
  }
  bctx.putImageData(bd, 0, 0)

  // matte canvas (alpha only) at guide resolution
  const mc = makeCanvas(matte.w, matte.h)
  const mctx = mc.getContext('2d')!
  const md = mctx.createImageData(matte.w, matte.h)
  for (let i = 0; i < matte.alpha.length; i++) md.data[i * 4 + 3] = Math.round(matte.alpha[i] * 255)
  mctx.putImageData(md, 0, 0)

  const out = makeCanvas(W, H)
  const octx = out.getContext('2d')!
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(bc, 0, 0, W, H)
  const fg = makeCanvas(W, H)
  const fctx = fg.getContext('2d')!
  fctx.drawImage(img, 0, 0)
  fctx.imageSmoothingQuality = 'high'
  fctx.globalCompositeOperation = 'destination-in'
  fctx.drawImage(mc, 0, 0, W, H)
  octx.drawImage(fg, 0, 0)

  const type = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg'
  const blob = await new Promise<Blob>((resolve, reject) => out.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), type, 0.92))
  return { blob, info: { mode: matte.mode, backend: matte.backend, depth: depthUsed, depthFailed } }
}
