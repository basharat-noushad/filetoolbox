import { traceImageData, type VectorPreset } from './vectorizeCore'

export type { VectorPreset }
export { PRESETS } from './vectorizeCore'

export const MAX_EDGE = 1200

export interface VectorizeResult {
  svg: string
  width: number
  height: number
  downscaled: boolean
  pathCount: number
}

async function loadBitmap(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function vectorizeImage(file: File, preset: VectorPreset): Promise<VectorizeResult> {
  const img = await loadBitmap(file)
  const w0 = img.naturalWidth, h0 = img.naturalHeight
  const k = Math.min(1, MAX_EDGE / Math.max(w0, h0))
  const w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k))
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)
  // viewBox stays in traced px; width/height attrs would be scaled, so scale=1 and set size below
  const req = { imageData, preset, scale: 1 }

  let svg: string
  try {
    svg = await new Promise<string>((resolve, reject) => {
      const worker = new Worker(new URL('./vectorizeWorker.ts', import.meta.url))
      worker.onmessage = e => { worker.terminate(); if (e.data.error) reject(new Error(e.data.error)); else resolve(e.data.svg) }
      worker.onerror = ev => { worker.terminate(); reject(new Error(ev.message)) }
      worker.postMessage(req)
    })
  } catch {
    // ponytail: worker unavailable -> blocks main thread, upgrade only if this path is hit in practice
    svg = traceImageData(req)
  }
  // render at the original size, keep viewBox of the traced grid
  svg = svg.replace(/<svg ([^>]*?)width="[^"]*" height="[^"]*"/, `<svg $1width="${w0}" height="${h0}"`)
  if (!/<svg [^>]*width=/.test(svg)) svg = svg.replace('<svg ', `<svg width="${w0}" height="${h0}" `)
  return { svg, width: w0, height: h0, downscaled: k < 1, pathCount: (svg.match(/<path /g) ?? []).length }
}
