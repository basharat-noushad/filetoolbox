import * as ort from 'onnxruntime-web'

// Tiled Real-ESRGAN (realesr-general-x4v3) inference. Runs the 4x model per tile, optionally box-downsamples
// the tile to 2x, and feather-blends overlaps into one RGBA buffer. WebGPU first, wasm fallback.
export type UpscaleRequest = { rgba: Uint8ClampedArray; w: number; h: number; scale: 2 | 4 }
export type UpscaleMessage =
  | { type: 'backend'; name: 'webgpu' | 'wasm' }
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; data: Uint8ClampedArray; w: number; h: number }
  | { type: 'error'; message: string }

const MODEL = self.location.origin + '/models/realesr-general-x4v3.onnx'
const T = 192 // tile edge (input px)
const O = 32 // overlap (input px); blended with a linear ramp

ort.env.wasm.wasmPaths = self.location.origin + '/ort/' // absolute: bundled workers can't fetch relative wasm paths

let backend: 'webgpu' | 'wasm' = 'webgpu'
const create = (ep: 'webgpu' | 'wasm') => {
  backend = ep
  self.postMessage({ type: 'backend', name: ep } satisfies UpscaleMessage)
  return ort.InferenceSession.create(MODEL, { executionProviders: [ep], graphOptimizationLevel: 'all' })
}

function starts(len: number): number[] {
  if (len <= T) return [0]
  const s: number[] = []
  for (let p = 0; ; p += T - O) {
    if (p + T >= len) { s.push(len - T); break }
    s.push(p)
  }
  return s
}

async function run(req: UpscaleRequest) {
  const { rgba, w, h, scale } = req
  const f = 4 / scale // box-downsample factor applied to the model's 4x output
  const ow = w * scale, oh = h * scale
  const out = new Uint8ClampedArray(ow * oh * 4)
  const xs = starts(w), ys = starts(h)
  const tw = Math.min(T, w), th = Math.min(T, h)
  const total = xs.length * ys.length

  let session: ort.InferenceSession
  try { session = await create('webgpu') } catch { session = await create('wasm') }

  let done = 0
  for (let j = 0; j < ys.length; j++) {
    for (let i = 0; i < xs.length; i++) {
      const x0 = xs[i], y0 = ys[j]
      const input = new Float32Array(3 * th * tw)
      const plane = th * tw
      for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) {
        const s = ((y0 + y) * w + x0 + x) * 4, d = y * tw + x
        input[d] = rgba[s] / 255; input[plane + d] = rgba[s + 1] / 255; input[2 * plane + d] = rgba[s + 2] / 255
      }
      const feeds = { input: new ort.Tensor('float32', input, [1, 3, th, tw]) }
      let res: ort.InferenceSession.OnnxValueMapType
      try { res = await session.run(feeds) } catch (e) {
        if (backend === 'wasm') throw e
        session = await create('wasm') // WebGPU session built fine but failed at run time (driver/memory)
        res = await session.run(feeds)
      }
      const t = res.output
      const od = t.data as Float32Array
      const W4 = tw * 4, p4 = W4 * th * 4
      const tow = tw * scale, toh = th * scale
      // left/top ramp lengths = overlap with the previously written tile, in output px
      const rx = i > 0 ? (xs[i - 1] + tw - x0) * scale : 0
      const ry = j > 0 ? (ys[j - 1] + th - y0) * scale : 0
      const area = f * f
      for (let y = 0; y < toh; y++) {
        const wy = y < ry ? (y + 0.5) / ry : 1
        for (let x = 0; x < tow; x++) {
          const wx = x < rx ? (x + 0.5) / rx : 1
          const wt = wx * wy
          const d = ((y0 * scale + y) * ow + x0 * scale + x) * 4
          for (let c = 0; c < 3; c++) {
            let sum = 0
            for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) sum += od[c * p4 + (y * f + dy) * W4 + x * f + dx]
            const v = (sum / area) * 255
            out[d + c] = wt >= 1 ? v : out[d + c] * (1 - wt) + v * wt
          }
          out[d + 3] = 255
        }
      }
      t.dispose()
      self.postMessage({ type: 'progress', done: ++done, total } satisfies UpscaleMessage)
    }
  }
  self.postMessage({ type: 'done', data: out, w: ow, h: oh } satisfies UpscaleMessage, { transfer: [out.buffer] })
}

self.onmessage = (e: MessageEvent<UpscaleRequest>) => {
  run(e.data).catch(err => self.postMessage({ type: 'error', message: String(err?.message ?? err) } satisfies UpscaleMessage))
}
