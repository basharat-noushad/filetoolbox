import { PDFDocument, degrees } from 'pdf-lib'

export type RotationAngle = 90 | 180 | 270

export async function rotatePdf(file: File, angle: RotationAngle, pageIndices?: number[]): Promise<Blob> {
  const pdf = await PDFDocument.load(await file.arrayBuffer())
  const allPages = pdf.getPages()
  const targets = pageIndices ?? allPages.map((_, i) => i)
  targets.forEach(i => {
    const page = allPages[i]
    page.setRotation(degrees((page.getRotation().angle + angle) % 360))
  })
  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
