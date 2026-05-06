import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function addPageNumbers(
  file: File,
  position: 'bottom-center' | 'bottom-right' | 'top-center' = 'bottom-center'
): Promise<Blob> {
  const pdf = await PDFDocument.load(await file.arrayBuffer())
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()
  const total = pages.length

  pages.forEach((page, i) => {
    const { width, height } = page.getSize()
    const text = `${i + 1} / ${total}`
    const textWidth = font.widthOfTextAtSize(text, 11)

    let x = width / 2 - textWidth / 2
    let y = 20
    if (position === 'bottom-right') { x = width - textWidth - 20 }
    if (position === 'top-center') { y = height - 30 }

    page.drawText(text, { x, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) })
  })

  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
