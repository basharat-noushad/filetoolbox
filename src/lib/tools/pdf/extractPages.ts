import { PDFDocument } from 'pdf-lib'

export async function extractPdfPages(file: File, pages: number[]): Promise<Blob> {
  const source = await PDFDocument.load(await file.arrayBuffer())
  const out = await PDFDocument.create()
  const indices = pages.map(n => n - 1).filter(i => i >= 0 && i < source.getPageCount())
  const copied = await out.copyPages(source, indices)
  copied.forEach(p => out.addPage(p))
  const bytes = await out.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
