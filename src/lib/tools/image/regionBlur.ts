// Blur or pixelate rectangular regions of an image, fully in the browser.
// Rects are normalized (0-1) so the UI preview scale never matters.
export interface NormRect { x: number; y: number; w: number; h: number }
export type RegionEffect = 'blur' | 'pixelate'

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

// strength is 1-50 (same slider as whole-image blur); scaled so a face stays hidden on large photos too.
// ponytail: whole image is blurred/pixelated once, then clipped per rect, so cost doesn't grow with rect count.
export async function effectRegions(file: File, rects: NormRect[], effect: RegionEffect, strength: number): Promise<Blob> {
  const img = await loadImage(file)
  const W = img.naturalWidth, H = img.naturalHeight
  const scale = Math.max(1, Math.max(W, H) / 1000)

  const filtered = makeCanvas(W, H)
  const fctx = filtered.getContext('2d')!
  if (effect === 'pixelate') {
    const block = Math.max(2, Math.round(strength * scale))
    const small = makeCanvas(Math.max(1, Math.ceil(W / block)), Math.max(1, Math.ceil(H / block)))
    small.getContext('2d')!.drawImage(img, 0, 0, small.width, small.height)
    fctx.imageSmoothingEnabled = false
    fctx.drawImage(small, 0, 0, small.width * block, small.height * block)
  } else {
    // pad by stretching border pixels so edges don't fade to transparent (no dark halo at image borders)
    const radius = Math.max(1, Math.round(strength * scale))
    const pad = Math.ceil(radius * 3)
    const bg = makeCanvas(W + pad * 2, H + pad * 2)
    const b = bg.getContext('2d')!
    b.drawImage(img, pad, pad)
    b.drawImage(img, 0, 0, 1, H, 0, pad, pad, H)
    b.drawImage(img, W - 1, 0, 1, H, W + pad, pad, pad, H)
    b.drawImage(img, 0, 0, W, 1, pad, 0, W, pad)
    b.drawImage(img, 0, H - 1, W, 1, pad, H + pad, W, pad)
    b.drawImage(img, 0, 0, 1, 1, 0, 0, pad, pad)
    b.drawImage(img, W - 1, 0, 1, 1, W + pad, 0, pad, pad)
    b.drawImage(img, 0, H - 1, 1, 1, 0, H + pad, pad, pad)
    b.drawImage(img, W - 1, H - 1, 1, 1, W + pad, H + pad, pad, pad)
    fctx.filter = `blur(${radius}px)`
    fctx.drawImage(bg, -pad, -pad)
    fctx.filter = 'none'
  }

  const out = makeCanvas(W, H)
  const o = out.getContext('2d')!
  o.drawImage(img, 0, 0)
  for (const r of rects) {
    const x = Math.max(0, Math.floor(r.x * W)), y = Math.max(0, Math.floor(r.y * H))
    const w = Math.min(W, Math.ceil((r.x + r.w) * W)) - x, h = Math.min(H, Math.ceil((r.y + r.h) * H)) - y
    if (w > 0 && h > 0) o.drawImage(filtered, x, y, w, h, x, y, w, h)
  }

  const type = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg'
  return new Promise((resolve, reject) =>
    out.toBlob(blob => blob ? resolve(blob) : reject(new Error('Export failed')), type, 0.92))
}
