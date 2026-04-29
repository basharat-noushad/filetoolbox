import { PDFDocument } from 'pdf-lib'

export async function compressPdf(file: File): Promise<Blob> {
  const pdf = await PDFDocument.load(await file.arrayBuffer())
  const bytes = await pdf.save({ useObjectStreams: true })
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
