import JSZip from 'jszip'
import { withPdf } from './pdfjs'

export async function pdfToImages(file: File, format: 'jpeg' | 'png' = 'jpeg', quality = 0.92, dpi = 144): Promise<Blob> {
  const zip = new JSZip()
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const ext  = format === 'jpeg' ? 'jpg' : 'png'
  await withPdf(file, async pdf => {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: dpi / 72 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvas, viewport }).promise
      const base64 = canvas.toDataURL(mime, quality).split(',')[1]
      zip.file(`page_${String(i).padStart(3, '0')}.${ext}`, base64, { base64: true })
    }
  })
  return zip.generateAsync({ type: 'blob' })
}
