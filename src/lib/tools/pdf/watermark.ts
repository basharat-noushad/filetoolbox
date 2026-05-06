import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'

export async function addWatermarkToPdf(
  file: File,
  text: string,
  options: { opacity?: number; fontSize?: number; rotation?: number } = {}
): Promise<Blob> {
  const pdf = await PDFDocument.load(await file.arrayBuffer())
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()

  pages.forEach(page => {
    const { width, height } = page.getSize()
    page.drawText(text, {
      x: width / 4,
      y: height / 2,
      size: options.fontSize ?? 60,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: options.opacity ?? 0.3,
      rotate: degrees(options.rotation ?? 45),
    })
  })

  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
