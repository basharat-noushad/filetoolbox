import JSZip from 'jszip'

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

/** Renders the image into a square canvas of `size` px (transparent padding or centre crop). */
export function renderSquare(img: HTMLImageElement, size: number, mode: FitMode): HTMLCanvasElement {
  // SVGs without intrinsic size report 0; fall back to 512
  const iw = img.naturalWidth || 512, ih = img.naturalHeight || 512
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  const s = mode === 'pad' ? Math.min(size / iw, size / ih) : Math.max(size / iw, size / ih)
  const w = iw * s, h = ih * s
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
  return c
}

const toPng = (c: HTMLCanvasElement) =>
  new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'))

/** ICO container whose entries are PNG-encoded (supported by all current browsers and Windows). */
export async function buildIco(img: HTMLImageElement, mode: FitMode, sizes = [16, 32, 48]): Promise<Blob> {
  const pngs = await Promise.all(sizes.map(async s => new Uint8Array(await (await toPng(renderSquare(img, s, mode))).arrayBuffer())))
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

export async function buildFaviconZip(img: HTMLImageElement, mode: FitMode): Promise<Blob> {
  const zip = new JSZip()
  zip.file('favicon.ico', await buildIco(img, mode))
  zip.file('apple-touch-icon.png', await toPng(renderSquare(img, 180, mode)))
  zip.file('icon-192.png', await toPng(renderSquare(img, 192, mode)))
  zip.file('icon-512.png', await toPng(renderSquare(img, 512, mode)))
  zip.file('site.webmanifest', MANIFEST)
  zip.file('favicon-links.html', LINK_SNIPPET + '\n')
  return zip.generateAsync({ type: 'blob' })
}
