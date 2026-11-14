import type { OrtReply, OrtRequest } from './ortWorker'
import { detectFaces } from './faceDetect'

// In-browser subject matting for Blur Image. Models are self-hosted under /models (Apache-2.0, see README there)
// and run in a Web Worker via onnxruntime-web, so the photo never leaves the device.
//  - Person: MODNet portrait matting (soft alpha, good hair edges), ~512px
//  - Any subject: U2-Net-p salient object model, 320px (pets, products, objects)
// The low-res matte is then refined with a guided filter using the photo itself as guide so edges follow real contours.

export type SubjectMode = 'auto' | 'person' | 'any'
export type Progress = (label: string, pct?: number) => void
export class NoSubjectError extends Error {}

type ModelKey = 'modnet' | 'u2netp' | 'depth'
const MODELS: Record<ModelKey, { url: string; mb: number; gpu: boolean }> = {
  modnet: { url: '/models/modnet.onnx', mb: 26, gpu: true },
  u2netp: { url: '/models/u2netp.onnx', mb: 4.6, gpu: true },
  depth: { url: '/models/depth-anything-v2-small-q8.onnx', mb: 27, gpu: false }, // int8 ops: wasm only
}

type Ok = Extract<OrtReply, { ok: true }>
let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, { resolve: (r: Ok) => void; reject: (e: Error) => void }>()
const ready = new Map<ModelKey, Promise<void>>()

function getWorker() {
  if (worker) return worker
  const w = new Worker(new URL('./ortWorker.ts', import.meta.url))
  w.onmessage = (ev: MessageEvent<OrtReply>) => {
    const p = pending.get(ev.data.id); pending.delete(ev.data.id)
    if (!p) return
    if (ev.data.ok) p.resolve(ev.data); else p.reject(new Error(ev.data.message))
  }
  w.onerror = () => {
    const ps = [...pending.values()]
    closeMatting()
    ps.forEach(p => p.reject(new Error('Worker failed')))
  }
  return (worker = w)
}

type Msg = OrtRequest extends infer R ? (R extends { id: number } ? Omit<R, 'id'> : never) : never
function call(msg: Msg, transfer: Transferable[] = []) {
  return new Promise<Ok>((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ ...msg, id } as OrtRequest, transfer)
  })
}

export function closeMatting() {
  worker?.terminate(); worker = null
  pending.clear(); ready.clear()
}

export const isModelLoaded = (k: ModelKey) => ready.has(k)
export const modelSizeMB = (k: ModelKey) => MODELS[k].mb

async function download(url: string, onPct: (p: number) => void): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Model download failed (${res.status})`)
  const total = Number(res.headers.get('content-length')) || 0
  if (!res.body) return res.arrayBuffer()
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let got = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value); got += value.length
    if (total) onPct(Math.min(1, got / total))
  }
  const out = new Uint8Array(got)
  let o = 0
  for (const c of chunks) { out.set(c, o); o += c.length }
  return out.buffer
}

function loadModel(k: ModelKey, progress?: Progress) {
  let p = ready.get(k)
  if (!p) {
    const m = MODELS[k]
    p = (async () => {
      const buf = await download(m.url, f => progress?.(`Downloading model (${m.mb} MB, first time only)`, f))
      progress?.('Preparing model')
      await call({ type: 'init', key: k, buffer: buf, gpu: m.gpu, origin: location.origin }, [buf])
    })().catch(e => { ready.delete(k); throw e })
    ready.set(k, p)
  }
  return p
}

async function infer(k: ModelKey, data: Float32Array, dims: number[], progress?: Progress) {
  await loadModel(k, progress)
  progress?.('Analysing photo')
  const r = await call({ type: 'run', key: k, data, dims }, [data.buffer])
  return { out: r.out!, dims: r.dims!, backend: r.backend }
}

// ---------- pixel helpers ----------

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

export function scaled(img: CanvasImageSource, w: number, h: number) {
  const c = makeCanvas(w, h)
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.imageSmoothingQuality = 'high'
  x.drawImage(img, 0, 0, w, h)
  return x.getImageData(0, 0, w, h)
}

export function resizeBilinear(src: Float32Array, sw: number, sh: number, dw: number, dh: number) {
  if (sw === dw && sh === dh) return src
  const out = new Float32Array(dw * dh)
  const xr = sw / dw, yr = sh / dh
  for (let y = 0; y < dh; y++) {
    const fy = Math.min(sh - 1, Math.max(0, (y + 0.5) * yr - 0.5))
    const y0 = Math.floor(fy), y1 = Math.min(sh - 1, y0 + 1), ty = fy - y0
    for (let x = 0; x < dw; x++) {
      const fx = Math.min(sw - 1, Math.max(0, (x + 0.5) * xr - 0.5))
      const x0 = Math.floor(fx), x1 = Math.min(sw - 1, x0 + 1), tx = fx - x0
      const a = src[y0 * sw + x0] * (1 - tx) + src[y0 * sw + x1] * tx
      const b = src[y1 * sw + x0] * (1 - tx) + src[y1 * sw + x1] * tx
      out[y * dw + x] = a * (1 - ty) + b * ty
    }
  }
  return out
}

// normalised box mean with clamped edges (separable running sum)
export function boxMean(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h)
  const n = 2 * r + 1
  for (let y = 0; y < h; y++) {
    const o = y * w
    let s = 0
    for (let k = -r; k <= r; k++) s += src[o + Math.min(w - 1, Math.max(0, k))]
    for (let x = 0; x < w; x++) {
      tmp[o + x] = s / n
      s += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0
    for (let k = -r; k <= r; k++) s += tmp[Math.min(h - 1, Math.max(0, k)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / n
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }
  return out
}

// He et al. guided filter, grayscale guide
function guidedFilter(I: Float32Array, p: Float32Array, w: number, h: number, r: number, eps: number) {
  const n = w * h
  const mI = boxMean(I, w, h, r), mp = boxMean(p, w, h, r)
  const II = new Float32Array(n), Ip = new Float32Array(n)
  for (let i = 0; i < n; i++) { II[i] = I[i] * I[i]; Ip[i] = I[i] * p[i] }
  const mII = boxMean(II, w, h, r), mIp = boxMean(Ip, w, h, r)
  const a = new Float32Array(n), b = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const v = mII[i] - mI[i] * mI[i]
    a[i] = (mIp[i] - mI[i] * mp[i]) / (v + eps)
    b[i] = mp[i] - a[i] * mI[i]
  }
  const ma = boxMean(a, w, h, r), mb = boxMean(b, w, h, r)
  const q = new Float32Array(n)
  for (let i = 0; i < n; i++) q[i] = Math.min(1, Math.max(0, ma[i] * I[i] + mb[i]))
  return q
}

const IMN = { m: [0.485, 0.456, 0.406], s: [0.229, 0.224, 0.225] }

function toTensor(d: ImageData, mean: number[], std: number[]) {
  const n = d.width * d.height
  const t = new Float32Array(3 * n)
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) t[c * n + i] = (d.data[i * 4 + c] / 255 - mean[c]) / std[c]
  return t
}

const fit = (w: number, h: number, long: number, mult: number) => {
  const s = long / Math.max(w, h)
  return [Math.max(mult, Math.round(w * s / mult) * mult), Math.max(mult, Math.round(h * s / mult) * mult)]
}

export type Matte = { alpha: Float32Array; w: number; h: number; mode: 'person' | 'any'; backend: string }

// Soft subject matte, refined against the photo, at (up to) 1536px on the long side.
export async function computeMatte(img: HTMLImageElement, file: File, mode: SubjectMode, progress?: Progress): Promise<Matte> {
  const W = img.naturalWidth, H = img.naturalHeight
  let kind: 'person' | 'any' = mode === 'person' ? 'person' : 'any'
  if (mode === 'auto') {
    progress?.('Looking for people')
    try { if ((await detectFaces(file)).length > 0) kind = 'person' } catch { /* salient-object model still works */ }
  }

  let raw: Float32Array, rw: number, rh: number, backend: string
  if (kind === 'person') {
    const [w, h] = fit(W, H, 512, 32)
    const r = await infer('modnet', toTensor(scaled(img, w, h), [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]), [1, 3, h, w], progress)
    raw = r.out; rw = w; rh = h; backend = r.backend
  } else {
    const r = await infer('u2netp', toTensor(scaled(img, 320, 320), IMN.m, IMN.s), [1, 3, 320, 320], progress)
    let lo = Infinity, hi = -Infinity
    for (const v of r.out) { if (v < lo) lo = v; if (v > hi) hi = v }
    const d = hi - lo || 1
    raw = r.out.map(v => (v - lo) / d)
    rw = 320; rh = 320; backend = r.backend
  }

  progress?.('Refining edges')
  const s = Math.min(1, 1536 / Math.max(W, H))
  const gw = Math.max(1, Math.round(W * s)), gh = Math.max(1, Math.round(H * s))
  const guide = scaled(img, gw, gh)
  const I = new Float32Array(gw * gh)
  for (let i = 0; i < I.length; i++) I[i] = (0.299 * guide.data[i * 4] + 0.587 * guide.data[i * 4 + 1] + 0.114 * guide.data[i * 4 + 2]) / 255
  const p = resizeBilinear(raw, rw, rh, gw, gh)
  const r = Math.max(3, Math.round(Math.max(gw, gh) / 220))
  const q = guidedFilter(I, p, gw, gh, r, 2e-4)
  // keep the model's confident interior/exterior, take the guided result only along the edge band, then tighten
  const alpha = new Float32Array(gw * gh)
  let cover = 0
  for (let i = 0; i < alpha.length; i++) {
    const v = p[i] < 0.02 ? 0 : p[i] > 0.98 ? 1 : q[i]
    const t = Math.min(1, Math.max(0, (v - 0.08) / 0.84))
    alpha[i] = t * t * (3 - 2 * t)
    cover += alpha[i]
  }
  if (cover / alpha.length < 0.01) throw new NoSubjectError('No subject found')
  return { alpha, w: gw, h: gh, mode: kind, backend }
}

// Relative depth (1 = near, 0 = far), resized to w x h. Throws if the depth model can't run.
export async function computeDepth(img: HTMLImageElement, w: number, h: number, progress?: Progress) {
  const [dw, dh] = fit(img.naturalWidth, img.naturalHeight, 518, 14)
  const r = await infer('depth', toTensor(scaled(img, dw, dh), IMN.m, IMN.s), [1, 3, dh, dw], progress)
  let lo = Infinity, hi = -Infinity
  for (const v of r.out) { if (v < lo) lo = v; if (v > hi) hi = v }
  const d = hi - lo || 1
  const norm = r.out.map(v => (v - lo) / d)
  return resizeBilinear(norm, dw, dh, w, h)
}
