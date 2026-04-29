import { PDFDocument } from 'pdf-lib'

export async function deletePdfPages(file: File, pagesToDelete: number[]): Promise<Blob> {
  const source = await PDFDocument.load(await file.arrayBuffer())
  const keepIndices = Array.from({ length: source.getPageCount() }, (_, i) => i)
    .filter(i => !pagesToDelete.includes(i + 1))
  const out = await PDFDocument.create()
  const pages = await out.copyPages(source, keepIndices)
  pages.forEach(p => out.addPage(p))
  const bytes = await out.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
