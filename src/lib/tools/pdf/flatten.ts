import { PDFDocument } from 'pdf-lib'

export async function flattenPdf(file: File): Promise<Blob> {
  const pdf = await PDFDocument.load(await file.arrayBuffer())
  const form = pdf.getForm()
  form.flatten()
  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
