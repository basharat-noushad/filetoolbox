import { PDFDocument } from 'pdf-lib'

export async function mergePdfs(files: File[]): Promise<Blob> {
  const merged = await PDFDocument.create()
  for (const file of files) {
    const pdf = await PDFDocument.load(await file.arrayBuffer())
    const pages = await merged.copyPages(pdf, pdf.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }
  const bytes = await merged.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
