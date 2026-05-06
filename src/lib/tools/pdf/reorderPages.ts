import { PDFDocument } from 'pdf-lib'

export async function reorderPdfPages(file: File, order: number[]): Promise<Blob> {
  const source = await PDFDocument.load(await file.arrayBuffer())
  const out = await PDFDocument.create()
  const indices = order.map(n => n - 1)
  const pages = await out.copyPages(source, indices)
  pages.forEach(p => out.addPage(p))
  const bytes = await out.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
