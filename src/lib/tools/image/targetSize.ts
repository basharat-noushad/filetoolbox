export type TargetMime = 'image/jpeg' | 'image/webp'

export interface TargetSizeResult {
  blob: Blob
  width: number
  height: number
  quality: number
  mimeType: string
  /** true when the output is <= targetBytes */
  reached: boolean
  /** true when the original already fit and was returned untouched */
  unchanged: boolean
  /** true when dimensions were reduced */
  downscaled: boolean
}

const MIN_Q = 0.05
const MAX_Q = 0.95
const Q_STEPS = 7
const MAX_DOWNSCALES = 14
const SCALE_STEP = 0.85

function toBlob(canvas: HTMLCanvasElement, mime: string, q: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Encoding failed'))), mime, q),
  )
}

async function decode(file: File): Promise<{ src: CanvasImageSource; w: number; h: number; close: () => void }> {
  const bmp = await createImageBitmap(file)
  return { src: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() }
}

/**
 * Compress to at most `targetBytes`. Binary-searches JPEG/WebP quality; if even the
 * minimum quality is too large, shrinks dimensions by 0.85x and retries.
 * ponytail: encodes up to ~7 x 15 times worst case; fine for typical photos.
 */
export async function compressToTargetSize(
  file: File,
  targetBytes: number,
  outMime: TargetMime,
): Promise<TargetSizeResult> {
  const img = await decode(file)
  try {
    if (file.size <= targetBytes) {
      return { blob: file, width: img.w, height: img.h, quality: 1, mimeType: file.type, reached: true, unchanged: true, downscaled: false }
    }
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    let scale = 1
    let smallest: { blob: Blob; w: number; h: number; q: number } | null = null

    for (let attempt = 0; attempt <= MAX_DOWNSCALES; attempt++) {
      const w = Math.max(1, Math.round(img.w * scale))
      const h = Math.max(1, Math.round(img.h * scale))
      canvas.width = w
      canvas.height = h
      ctx.clearRect(0, 0, w, h)
      if (outMime === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h) }
      ctx.drawImage(img.src, 0, 0, w, h)

      const minBlob = await toBlob(canvas, outMime, MIN_Q)
      if (!smallest || minBlob.size < smallest.blob.size) smallest = { blob: minBlob, w, h, q: MIN_Q }

      if (minBlob.size <= targetBytes) {
        // Largest quality that still fits.
        let lo = MIN_Q, hi = MAX_Q
        let best = { blob: minBlob, q: MIN_Q }
        for (let i = 0; i < Q_STEPS; i++) {
          const mid = (lo + hi) / 2
          const b = await toBlob(canvas, outMime, mid)
          if (b.size <= targetBytes) { best = { blob: b, q: mid }; lo = mid } else hi = mid
        }
        return { blob: best.blob, width: w, height: h, quality: best.q, mimeType: outMime, reached: true, unchanged: false, downscaled: scale < 1 }
      }
      scale *= SCALE_STEP
      if (Math.min(img.w, img.h) * scale < 8) break
    }
    return {
      blob: smallest!.blob, width: smallest!.w, height: smallest!.h, quality: smallest!.q,
      mimeType: outMime, reached: smallest!.blob.size <= targetBytes, unchanged: false, downscaled: smallest!.w !== img.w,
    }
  } finally {
    img.close()
  }
}
