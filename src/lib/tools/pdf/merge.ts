import { PDFDocument } from 'pdf-lib'

export async function mergePdfs(files: File[]): Promise<Blob> {
  const merged = await PDFDocument.create()
  for (const file of files) {
    if (file.type.startsWith('image/') || /\.(jpe?g|png)$/i.test(file.name)) {
      // ponytail: page sized to the image (1px = 1pt); no A4 fitting
      const buf = await file.arrayBuffer()
      const isPng = file.type === 'image/png' || /\.png$/i.test(file.name)
      const img = isPng ? await merged.embedPng(buf) : await merged.embedJpg(buf)
      merged.addPage([img.width, img.height]).drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
      continue
    }
    const pdf = await PDFDocument.load(await file.arrayBuffer())
    const pages = await merged.copyPages(pdf, pdf.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }
  const bytes = await merged.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
