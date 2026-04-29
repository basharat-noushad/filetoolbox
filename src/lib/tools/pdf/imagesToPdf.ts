import { PDFDocument } from 'pdf-lib'

export async function imagesToPdf(files: File[]): Promise<Blob> {
  const pdf = await PDFDocument.create()
  for (const file of files) {
    const buf = await file.arrayBuffer()
    const img = file.type === 'image/jpeg' ? await pdf.embedJpg(buf) : await pdf.embedPng(buf)
    const page = pdf.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  }
  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
