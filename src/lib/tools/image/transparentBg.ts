export type RGB = [number, number, number]

export interface TransparentOptions {
  bg: RGB
  /** 0-100: how far (per channel) a pixel may differ from bg and still be removed */
  tolerance: number
  /** remove every matching pixel, not only those connected to the border */
  removeAll: boolean
}

const FEATHER = 28 // colour-distance range over which the edge fades from transparent to opaque

/** Median colour of the 1px image border. */
export function detectBackground(img: ImageData): RGB {
  const { width: w, height: h, data } = img
  const rs: number[] = [], gs: number[] = [], bs: number[] = []
  const add = (x: number, y: number) => {
    const i = (y * w + x) * 4
    rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2])
  }
  for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1) }
  for (let y = 1; y < h - 1; y++) { add(0, y); add(w - 1, y) }
  const med = (a: number[]) => a.sort((p, q) => p - q)[a.length >> 1]
  return [med(rs), med(gs), med(bs)]
}

/** Edits `img` in place: matching background pixels get alpha 0, a 1px ring gets partial alpha. */
export function makeTransparent(img: ImageData, { bg, tolerance, removeAll }: TransparentOptions): void {
  const { width: w, height: h, data } = img
  const n = w * h
  const tol = Math.round(tolerance * 2.55)
  const [br, bg_, bb] = bg
  const dist = (p: number) => {
    const i = p * 4
    const a = Math.abs(data[i] - br), b = Math.abs(data[i + 1] - bg_), c = Math.abs(data[i + 2] - bb)
    return a > b ? (a > c ? a : c) : (b > c ? b : c)
  }

  const removed = new Uint8Array(n)
  if (removeAll) {
    for (let p = 0; p < n; p++) if (dist(p) <= tol) removed[p] = 1
  } else {
    // iterative 4-connected flood fill seeded from border pixels; each pixel pushed at most once
    const stack = new Int32Array(n)
    let sp = 0
    const push = (p: number) => { if (!removed[p] && dist(p) <= tol) { removed[p] = 1; stack[sp++] = p } }
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
    for (let y = 1; y < h - 1; y++) { push(y * w); push(y * w + w - 1) }
    while (sp > 0) {
      const p = stack[--sp]
      const x = p % w
      if (x > 0) push(p - 1)
      if (x < w - 1) push(p + 1)
      if (p >= w) push(p - w)
      if (p < n - w) push(p + w)
    }
  }

  // soft edge: kept pixels touching a removed pixel and close to bg fade, with bg colour removed from them
  const edge: number[] = []
  for (let p = 0; p < n; p++) {
    if (removed[p]) continue
    const x = p % w
    if ((x > 0 && removed[p - 1]) || (x < w - 1 && removed[p + 1]) || (p >= w && removed[p - w]) || (p < n - w && removed[p + w])) edge.push(p)
  }
  for (const p of edge) {
    const d = dist(p)
    if (d >= tol + FEATHER) continue
    const a = (d - tol) / FEATHER
    const i = p * 4
    data[i + 3] = Math.round(a * 255)
    if (a > 0.05) {
      data[i] = Math.max(0, Math.min(255, (data[i] - br * (1 - a)) / a))
      data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - bg_ * (1 - a)) / a))
      data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - bb * (1 - a)) / a))
    }
  }
  for (let p = 0; p < n; p++) if (removed[p]) data[p * 4 + 3] = 0
}

export async function loadImageData(file: File | Blob, maxSide?: number): Promise<ImageData> {
  const bmp = await createImageBitmap(file)
  const s = maxSide ? Math.min(1, maxSide / Math.max(bmp.width, bmp.height)) : 1
  const w = Math.max(1, Math.round(bmp.width * s)), h = Math.max(1, Math.round(bmp.height * s))
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  return ctx.getImageData(0, 0, w, h)
}

/** Full-resolution transparent PNG. `bg` omitted = auto-detect per image. */
export async function jpgToTransparentPng(
  file: File, opts: { bg?: RGB; tolerance: number; removeAll: boolean },
): Promise<Blob> {
  const img = await loadImageData(file)
  makeTransparent(img, { bg: opts.bg ?? detectBackground(img), tolerance: opts.tolerance, removeAll: opts.removeAll })
  const canvas = document.createElement('canvas')
  canvas.width = img.width; canvas.height = img.height
  canvas.getContext('2d')!.putImageData(img, 0, 0)
  return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'))
}
