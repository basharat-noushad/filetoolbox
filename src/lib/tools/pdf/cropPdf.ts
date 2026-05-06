import { PDFDocument } from 'pdf-lib'

export interface CropMargins { top: number; right: number; bottom: number; left: number }

export async function cropPdf(file: File, margins: CropMargins): Promise<Blob> {
  const pdf = await PDFDocument.load(await file.arrayBuffer())
  pdf.getPages().forEach(page => {
    const { width, height } = page.getSize()
    page.setCropBox(
      margins.left,
      margins.bottom,
      width - margins.left - margins.right,
      height - margins.top - margins.bottom
    )
  })
  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
