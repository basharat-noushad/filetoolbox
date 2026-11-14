import JSZip from 'jszip'
import { detectBackground, makeTransparent, type RGB } from './transparentBg'

export type FitMode = 'pad' | 'crop'

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')) }
    img.src = url
  })
}

export type Shape = 'none' | 'rounded' | 'circle'
export interface IconOpts {
  mode: FitMode
  /** 0-40: empty margin on each side, % of icon size */
  padding: number
  shape: Shape
  /** solid background fill (hex) or null for transparent */
  fill: string | null
  /** also apply shape to favicon.ico entries */
  shapeIco: boolean
}

/** Reads the image into ImageData, longest side capped at maxSide. */
export function imageToData(img: HTMLImageElement, maxSide: number): ImageData {
  const iw = img.naturalWidth || 512, ih = img.naturalHeight || 512 // SVGs without intrinsic size report 0
  const s = Math.min(1, maxSide / Math.max(iw, ih))
  const w = Math.max(1, Math.round(iw * s)), h = Math.max(1, Math.round(ih * s))
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

/** True when any pixel is noticeably transparent. */
export function hasTransparency(d: ImageData): boolean {
  for (let i = 3; i < d.data.length; i += 4) if (d.data[i] < 250) return true
  return false
}

export interface RemoveOpts { bg: RGB | null; tolerance: number; removeAll: boolean }

/** Copy of `d` with the plain background made transparent (bg null = auto-detect from the border). */
export function applyRemoval(d: ImageData, r: RemoveOpts): ImageData {
  const out = new ImageData(new Uint8ClampedArray(d.data), d.width, d.height)
  makeTransparent(out, { bg: r.bg ?? detectBackground(out), tolerance: r.tolerance, removeAll: r.removeAll })
  return out
}

/** Canvas of `d`, optionally cropped to the box around non-transparent pixels. */
export function toSource(d: ImageData, trim: boolean): HTMLCanvasElement {
  let x0 = 0, y0 = 0, x1 = d.width, y1 = d.height
  if (trim) {
    let a = d.width, b = d.height, c = -1, e = -1
    for (let y = 0; y < d.height; y++) for (let x = 0; x < d.width; x++) {
      if (d.data[(y * d.width + x) * 4 + 3] > 10) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > e) e = y }
    }
    if (c >= 0) { x0 = a; y0 = b; x1 = c + 1; y1 = e + 1 }
  }
  const full = document.createElement('canvas')
  full.width = d.width; full.height = d.height
  full.getContext('2d')!.putImageData(d, 0, 0)
  if (x0 === 0 && y0 === 0 && x1 === d.width && y1 === d.height) return full
  const c = document.createElement('canvas')
  c.width = x1 - x0; c.height = y1 - y0
  c.getContext('2d')!.drawImage(full, x0, y0, c.width, c.height, 0, 0, c.width, c.height)
  return c
}

/** Renders the source into a square icon of `size` px. */
export function renderIcon(src: CanvasImageSource & { width: number; height: number }, size: number, o: IconOpts, shape: Shape = o.shape, fill: string | null = o.fill): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  if (shape !== 'none') {
    ctx.beginPath()
    ctx.roundRect(0, 0, size, size, shape === 'circle' ? size / 2 : size * 0.22)
    ctx.clip()
  }
  if (fill) { ctx.fillStyle = fill; ctx.fillRect(0, 0, size, size) }
  const box = size * (1 - 2 * o.padding / 100)
  const iw = src.width || 512, ih = src.height || 512
  const s = o.mode === 'pad' ? Math.min(box / iw, box / ih) : Math.max(box / iw, box / ih)
  const w = iw * s, h = ih * s
  ctx.drawImage(src, (size - w) / 2, (size - h) / 2, w, h)
  return c
}

const toPng = (c: HTMLCanvasElement) =>
  new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'))

/** ICO container whose entries are PNG-encoded (supported by all current browsers and Windows). */
export async function buildIco(src: HTMLCanvasElement, o: IconOpts, sizes = [16, 32, 48]): Promise<Blob> {
  const shape = o.shapeIco ? o.shape : 'none'
  const pngs = await Promise.all(sizes.map(async s => new Uint8Array(await (await toPng(renderIcon(src, s, o, shape))).arrayBuffer())))
  const head = 6 + 16 * sizes.length
  const buf = new ArrayBuffer(head + pngs.reduce((n, p) => n + p.length, 0))
  const v = new DataView(buf), u8 = new Uint8Array(buf)
  v.setUint16(0, 0, true); v.setUint16(2, 1, true); v.setUint16(4, sizes.length, true) // ICONDIR
  let off = head
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i
    v.setUint8(e, s >= 256 ? 0 : s); v.setUint8(e + 1, s >= 256 ? 0 : s) // width, height
    v.setUint8(e + 2, 0); v.setUint8(e + 3, 0)                           // palette, reserved
    v.setUint16(e + 4, 1, true); v.setUint16(e + 6, 32, true)            // planes, bpp
    v.setUint32(e + 8, pngs[i].length, true); v.setUint32(e + 12, off, true)
    u8.set(pngs[i], off); off += pngs[i].length
  })
  return new Blob([buf], { type: 'image/x-icon' })
}

export const LINK_SNIPPET = `<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`

const MANIFEST = JSON.stringify({
  name: 'My Site', short_name: 'Site',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone',
}, null, 2)

export const APPLE_DEFAULT_FILL = '#ffffff'

export async function buildFaviconZip(src: HTMLCanvasElement, o: IconOpts): Promise<Blob> {
  const zip = new JSZip()
  zip.file('favicon.ico', await buildIco(src, o))
  // iOS paints transparent apple-touch-icons on black and rounds the corners itself: always solid + square
  zip.file('apple-touch-icon.png', await toPng(renderIcon(src, 180, o, 'none', o.fill ?? APPLE_DEFAULT_FILL)))
  zip.file('icon-192.png', await toPng(renderIcon(src, 192, o)))
  zip.file('icon-512.png', await toPng(renderIcon(src, 512, o)))
  zip.file('site.webmanifest', MANIFEST)
  zip.file('favicon-links.html', LINK_SNIPPET + '\n')
  return zip.generateAsync({ type: 'blob' })
}
