import { withPdf } from './pdfjs'

// A stamp placed on the VISIBLE page (what the preview shows: CropBox, rotated).
// x/y/w are fractions (0..1) of the displayed page, origin top-left; height follows the image aspect ratio.
export interface Placement { id: number; page: number; kind: 'sig' | 'date'; x: number; y: number; w: number }

// Box height as a fraction of page height, for an image of aspect ratio ar (= height/width) on a page of displayed aspect pa (= width/height).
export const boxH = (w: number, ar: number, pa: number) => w * ar * pa

export interface PagePreview { blob: Blob; numPages: number; aspect: number } // aspect = displayed width / height

export function renderPagePreview(file: File, pageNo: number, targetWidth = 900): Promise<PagePreview> {
  return withPdf(file, async pdf => {
    const page = await pdf.getPage(Math.min(Math.max(1, pageNo), pdf.numPages))
    const base = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: targetWidth / base.width })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width); canvas.height = Math.round(viewport.height)
    await page.render({ canvas, viewport, background: '#ffffff' }).promise
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('preview failed'))), 'image/png'))
    return { blob, numPages: pdf.numPages, aspect: base.width / base.height }
  })
}

// Draw the stamps into the PDF. pdf.js' viewport converts displayed coordinates to PDF user space
// (handles /Rotate and CropBox/MediaBox offsets); the image is then rotated to match the page.
export async function signPdf(file: File, items: Placement[], images: Record<'sig' | 'date', Uint8Array | null>): Promise<Blob> {
  const { PDFDocument, degrees } = await import('pdf-lib')
  const geo = await withPdf(file, async pdf => {
    const out = new Map<number, { conv: (x: number, y: number) => [number, number]; aspect: number }>()
    for (const n of new Set(items.map(i => i.page))) {
      const page = await pdf.getPage(n)
      const vp = page.getViewport({ scale: 1 })
      out.set(n, { conv: (x, y) => vp.convertToPdfPoint(x * vp.width, y * vp.height) as [number, number], aspect: vp.width / vp.height })
    }
    return out
  })
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true })
  const embedded = {
    sig: images.sig ? await doc.embedPng(images.sig) : null,
    date: images.date ? await doc.embedPng(images.date) : null,
  }
  const pages = doc.getPages()
  for (const it of items) {
    const img = embedded[it.kind]
    const page = pages[it.page - 1]
    const g = geo.get(it.page)
    if (!img || !page || !g) continue
    const { conv } = g
    const h = boxH(it.w, img.height / img.width, g.aspect)
    const y = Math.min(it.y, Math.max(0, 1 - h)) // keep inside the page (matters for "all pages")
    const bl = conv(it.x, y + h)
    const br = conv(it.x + it.w, y + h)
    const tl = conv(it.x, y)
    page.drawImage(img, {
      x: bl[0], y: bl[1],
      width: Math.hypot(br[0] - bl[0], br[1] - bl[1]),
      height: Math.hypot(tl[0] - bl[0], tl[1] - bl[1]),
      rotate: degrees((Math.atan2(br[1] - bl[1], br[0] - bl[0]) * 180) / Math.PI),
    })
  }
  const saved = await doc.save()
  return new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' })
}
