import type { UpscaleMessage, UpscaleRequest } from './upscaleWorker'

// Main-thread wrapper: pixels -> worker (tiled Real-ESRGAN) -> RGBA result. Cancel = terminate the worker.
export const AI_MAX_EDGE = { 2: 3000, 4: 1500 } as const
export type AIScale = keyof typeof AI_MAX_EDGE
export type AIProgress = { done: number; total: number; backend: 'webgpu' | 'wasm'; etaSec: number | null }

export function runUpscale(rgba: Uint8ClampedArray, w: number, h: number, scale: AIScale, onProgress: (p: AIProgress) => void) {
  const worker = new Worker(new URL('./upscaleWorker.ts', import.meta.url))
  let rejectFn: (e: Error) => void = () => {}
  const promise = new Promise<{ data: Uint8ClampedArray; w: number; h: number }>((resolve, reject) => {
    rejectFn = reject
    let backend: 'webgpu' | 'wasm' = 'webgpu'
    let t0 = 0
    worker.onmessage = (e: MessageEvent<UpscaleMessage>) => {
      const m = e.data
      if (m.type === 'backend') backend = m.name
      else if (m.type === 'progress') {
        const now = performance.now()
        if (!t0) t0 = now // tile 1 includes model load + shader compile, so the ETA clock starts after it
        const eta = m.done > 1 ? ((now - t0) / (m.done - 1)) * (m.total - m.done) / 1000 : null
        onProgress({ done: m.done, total: m.total, backend, etaSec: eta })
      } else if (m.type === 'done') { worker.terminate(); resolve(m) }
      else if (m.type === 'error') { worker.terminate(); reject(new Error(m.message)) }
    }
    worker.onerror = ev => { worker.terminate(); reject(new Error(ev.message || 'Worker failed')) }
    const req: UpscaleRequest = { rgba, w, h, scale }
    worker.postMessage(req, [rgba.buffer])
  })
  return { promise, cancel: () => { worker.terminate(); rejectFn(new DOMException('Cancelled', 'AbortError')) } }
}

// Draw the bitmap (shrunk so the long edge <= maxEdge) and return its pixels.
export function readPixels(bmp: ImageBitmap, maxEdge: number) {
  const k = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k))
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, w, h)
  return { w, h, img: ctx.getImageData(0, 0, w, h) }
}

// The model only sees RGB; carry transparency over by enlarging the alpha channel with plain smooth scaling.
export function applyAlpha(src: ImageData, out: ImageData) {
  let has = false
  for (let i = 3; i < src.data.length; i += 4) if (src.data[i] !== 255) { has = true; break }
  if (!has) return
  const a = document.createElement('canvas'); a.width = src.width; a.height = src.height
  const actx = a.getContext('2d')!
  const m = actx.createImageData(src.width, src.height)
  for (let i = 0; i < m.data.length; i += 4) { m.data[i] = m.data[i + 1] = m.data[i + 2] = 255; m.data[i + 3] = src.data[i + 3] }
  actx.putImageData(m, 0, 0)
  const b = document.createElement('canvas'); b.width = out.width; b.height = out.height
  const bctx = b.getContext('2d', { willReadFrequently: true })!
  bctx.imageSmoothingQuality = 'high'
  bctx.drawImage(a, 0, 0, out.width, out.height)
  const big = bctx.getImageData(0, 0, out.width, out.height).data
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = big[i]
}
