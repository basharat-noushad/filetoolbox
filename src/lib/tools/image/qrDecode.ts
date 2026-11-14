import jsQR from 'jsqr'

function readCanvas(c: HTMLCanvasElement) {
  return c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height)
}

function tryDecode(c: HTMLCanvasElement): string | null {
  const d = readCanvas(c)
  return jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' })?.data ?? null
}

/** Draws the source onto a white canvas (so transparent PNGs decode), scaled to maxDim and rotated. */
function draw(src: CanvasImageSource, w: number, h: number, maxDim: number, rot: number, binarise: boolean): HTMLCanvasElement {
  const k = Math.min(1, maxDim / Math.max(w, h))
  const sw = Math.max(1, Math.round(w * k)), sh = Math.max(1, Math.round(h * k))
  const c = document.createElement('canvas')
  const swap = rot === 90 || rot === 270
  c.width = swap ? sh : sw; c.height = swap ? sw : sh
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
  ctx.translate(c.width / 2, c.height / 2); ctx.rotate((rot * Math.PI) / 180)
  ctx.drawImage(src, -sw / 2, -sh / 2, sw, sh)
  if (binarise) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const img = ctx.getImageData(0, 0, c.width, c.height), p = img.data
    let sum = 0
    for (let i = 0; i < p.length; i += 4) sum += p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114
    const th = sum / (p.length / 4)
    for (let i = 0; i < p.length; i += 4) {
      const v = p[i] * 0.299 + p[i + 1] * 0.587 + p[i + 2] * 0.114 < th ? 0 : 255
      p[i] = p[i + 1] = p[i + 2] = v
    }
    ctx.putImageData(img, 0, 0)
  }
  return c
}

/** Robust decode: several scales, plain + contrast-stretched, then rotations. Inversion handled by jsQR. */
export async function decodeQr(src: CanvasImageSource, w: number, h: number, thorough = true): Promise<string | null> {
  const scales = thorough ? [1600, 1000, 640, 400, 2200] : [800]
  const rots = thorough ? [0, 90, 180, 270] : [0]
  for (const rot of rots) for (const bin of [false, true]) for (const m of scales) {
    const r = tryDecode(draw(src, w, h, m, rot, bin))
    if (r) return r
    await new Promise(res => setTimeout(res, 0)) // keep the UI responsive
  }
  return null
}

export async function decodeBlob(blob: Blob, thorough = true): Promise<string | null> {
  const bmp = await createImageBitmap(blob)
  try { return await decodeQr(bmp, bmp.width, bmp.height, thorough) } finally { bmp.close() }
}
