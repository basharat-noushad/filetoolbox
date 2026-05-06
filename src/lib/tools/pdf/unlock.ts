import { PDFDocument } from 'pdf-lib'

export async function unlockPdf(file: File, password: string): Promise<Blob> {
  // pdf-lib does not support decrypting password-protected PDFs
  // This loads the PDF (which may fail if actually encrypted with a user password)
  // For true decryption, server-side processing via Ghostscript is needed
  void password
  const pdf = await PDFDocument.load(await file.arrayBuffer(), {
    ignoreEncryption: true,
  })
  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
