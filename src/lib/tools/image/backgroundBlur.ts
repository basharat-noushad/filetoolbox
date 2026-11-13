import type { ImageSegmenter } from '@mediapipe/tasks-vision'

// Blurs everything except people, fully in the browser. MediaPipe's selfie segmenter and its wasm runtime
// are self-hosted under /mediapipe (see scripts/copy-wasm.cjs), so nothing is fetched from third parties.
// ponytail: selfie model only knows "person"; arbitrary objects need a different model.

const MIN_PERSON = 0.08 // fraction of the frame the model is >90% sure is a person (objects top out ~4%, portraits ~50%)

export class NoPersonError extends Error {}

let segmenterPromise: Promise<ImageSegmenter> | null = null

export function loadSegmenter(): Promise<ImageSegmenter> {
  segmenterPromise ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision')
    const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
    return ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: '/mediapipe/selfie_segmenter.tflite' },
      runningMode: 'IMAGE',
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    })
  })().catch(e => { segmenterPromise = null; throw e })
  return segmenterPromise
}

export function closeSegmenter() {
  const p = segmenterPromise
  segmenterPromise = null
  p?.then(s => s.close()).catch(() => {})
}

export function isSegmenterLoaded() { return segmenterPromise !== null }

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

const smoothstep = (x: number) => { const t = Math.min(1, Math.max(0, (x - 0.35) / 0.4)); return t * t * (3 - 2 * t) }

export async function blurBackground(file: File, radius: number): Promise<Blob> {
  const img = await loadImage(file)
  const W = img.naturalWidth, H = img.naturalHeight
  const segmenter = await loadSegmenter()

  // person confidence mask (low-res) -> alpha canvas
  const result = segmenter.segment(img)
  let maskCanvas: HTMLCanvasElement
  let personPixels = 0
  try {
    const masks = result.confidenceMasks
    const mask = masks?.[masks.length - 1]
    if (!mask) throw new Error('No mask')
    const data = mask.getAsFloat32Array()
    const mw = mask.width, mh = mask.height
    const small = makeCanvas(mw, mh)
    const sctx = small.getContext('2d')!
    const px = sctx.createImageData(mw, mh)
    for (let i = 0; i < data.length; i++) {
      if (data[i] > 0.9) personPixels++
      px.data[i * 4 + 3] = Math.round(smoothstep(data[i]) * 255)
    }
    sctx.putImageData(px, 0, 0)
    // ponytail: selfie model is tuned for close portraits; needs >=8% confident pixels, so tiny/distant people count as none
    if (personPixels / data.length < MIN_PERSON) throw new NoPersonError('No person detected')
    // upscale to full resolution, then feather the edge a little
    maskCanvas = makeCanvas(W, H)
    const mctx = maskCanvas.getContext('2d')!
    mctx.imageSmoothingQuality = 'high'
    mctx.filter = `blur(${Math.max(1, Math.round(Math.max(W, H) / 400))}px)`
    mctx.drawImage(small, 0, 0, W, H)
  } finally {
    result.close()
  }

  // blurred background, edges padded by stretching the border pixels so they don't fade to transparent
  const pad = Math.ceil(radius * 3)
  const bg = makeCanvas(W + pad * 2, H + pad * 2)
  const bctx = bg.getContext('2d')!
  bctx.drawImage(img, pad, pad)
  bctx.drawImage(img, 0, 0, 1, H, 0, pad, pad, H)
  bctx.drawImage(img, W - 1, 0, 1, H, W + pad, pad, pad, H)
  bctx.drawImage(img, 0, 0, W, 1, pad, 0, W, pad)
  bctx.drawImage(img, 0, H - 1, W, 1, pad, H + pad, W, pad)
  bctx.drawImage(img, 0, 0, 1, 1, 0, 0, pad, pad)
  bctx.drawImage(img, W - 1, 0, 1, 1, W + pad, 0, pad, pad)
  bctx.drawImage(img, 0, H - 1, 1, 1, 0, H + pad, pad, pad)
  bctx.drawImage(img, W - 1, H - 1, 1, 1, W + pad, H + pad, pad, pad)

  const out = makeCanvas(W, H)
  const octx = out.getContext('2d')!
  octx.filter = `blur(${radius}px)`
  octx.drawImage(bg, -pad, -pad)
  octx.filter = 'none'

  // sharp person layer = original cut out by the mask
  const fg = makeCanvas(W, H)
  const fctx = fg.getContext('2d')!
  fctx.drawImage(img, 0, 0)
  fctx.globalCompositeOperation = 'destination-in'
  fctx.drawImage(maskCanvas, 0, 0)
  octx.drawImage(fg, 0, 0)

  const type = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg'
  return new Promise((resolve, reject) =>
    out.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), type, 0.92))
}
