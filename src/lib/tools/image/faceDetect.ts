import type { FaceDetector } from '@mediapipe/tasks-vision'
import type { NormRect } from './regionBlur'

// Finds faces fully in the browser. MediaPipe's BlazeFace short-range model and its wasm runtime are
// self-hosted under /mediapipe, so nothing is fetched from third parties.
// ponytail: short-range model sees faces up to ~2 m; we also scan 2x2 overlapping tiles of large photos
// to catch smaller faces, but tiny/distant or heavily turned faces can still be missed.

let detectorPromise: Promise<FaceDetector> | null = null

export function loadFaceDetector(): Promise<FaceDetector> {
  detectorPromise ??= (async () => {
    const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision')
    const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: '/mediapipe/blaze_face_short_range.tflite' },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.5,
    })
  })().catch(e => { detectorPromise = null; throw e })
  return detectorPromise
}

export function closeFaceDetector() {
  const p = detectorPromise
  detectorPromise = null
  p?.then(d => d.close()).catch(() => {})
}

export function isFaceDetectorLoaded() { return detectorPromise !== null }

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

const area = (r: NormRect) => r.w * r.h
function iou(a: NormRect, b: NormRect) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  if (w <= 0 || h <= 0) return 0
  const i = w * h
  return i / (area(a) + area(b) - i)
}

// Returns face boxes as 0-1 fractions of the image, expanded to cover hair and chin.
export async function detectFaces(file: File): Promise<NormRect[]> {
  const img = await loadImage(file)
  const W = img.naturalWidth, H = img.naturalHeight
  const detector = await loadFaceDetector()

  const found: { r: NormRect; s: number }[] = []
  const run = (src: HTMLImageElement | HTMLCanvasElement, ox: number, oy: number) => {
    for (const d of detector.detect(src).detections) {
      const b = d.boundingBox
      if (!b) continue
      found.push({ r: { x: (ox + b.originX) / W, y: (oy + b.originY) / H, w: b.width / W, h: b.height / H }, s: d.categories[0]?.score ?? 0 })
    }
  }
  run(img, 0, 0)

  if (Math.max(W, H) >= 800) {
    // 2x2 tiles, each 60% of the frame, overlapping 20% so faces on the seams are not cut in half
    const tw = Math.round(W * 0.6), th = Math.round(H * 0.6)
    for (const ox of [0, W - tw]) for (const oy of [0, H - th]) {
      const c = document.createElement('canvas')
      c.width = tw; c.height = th
      c.getContext('2d')!.drawImage(img, ox, oy, tw, th, 0, 0, tw, th)
      run(c, ox, oy)
    }
  }

  // non-max suppression: keep the most confident box among overlapping duplicates
  found.sort((a, b) => b.s - a.s)
  const kept: NormRect[] = []
  for (const { r } of found) if (kept.every(k => iou(k, r) < 0.3)) kept.push(r)

  return kept.map(r => {
    const px = r.w * 0.15, py = r.h * 0.2
    const x = Math.max(0, r.x - px), y = Math.max(0, r.y - py)
    return { x, y, w: Math.min(1, r.x + r.w + px) - x, h: Math.min(1, r.y + r.h + py) - y }
  })
}
