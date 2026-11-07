import { PDFDocument } from 'pdf-lib'

export async function compressPdf(file: File): Promise<Blob> {
  const pdf = await PDFDocument.load(await file.arrayBuffer())
  const bytes = await pdf.save({ useObjectStreams: true })
  // Already optimized PDFs can grow when reserialized. Keep the smaller input.
  return bytes.byteLength < file.size
    ? new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    : file
}
