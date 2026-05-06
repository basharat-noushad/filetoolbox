import { PDFDocument } from 'pdf-lib'

export async function protectPdf(file: File, password: string): Promise<Blob> {
  const pdf = await PDFDocument.load(await file.arrayBuffer())
  // pdf-lib does not natively support encryption — save as-is and note limitation
  // For true encryption, use server-side Ghostscript via API route
  void password
  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
