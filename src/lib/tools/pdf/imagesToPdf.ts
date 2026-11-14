import { PDFDocument } from 'pdf-lib'

// Any other browser-decodable image (WebP, GIF first frame, BMP, AVIF…) is redrawn on a canvas and embedded as PNG.
async function toPngBytes(file: File): Promise<ArrayBuffer> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error(`Your browser cannot decode "${file.name}".`)
  }
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  bitmap.close()
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'))
  if (!blob) throw new Error(`Could not convert "${file.name}".`)
  return blob.arrayBuffer()
}

export async function imagesToPdf(files: File[]): Promise<Blob> {
  const pdf = await PDFDocument.create()
  for (const file of files) {
    const buf = await file.arrayBuffer()
    const img = file.type === 'image/jpeg' ? await pdf.embedJpg(buf)
      : file.type === 'image/png' ? await pdf.embedPng(buf)
      : await pdf.embedPng(await toPngBytes(file))
    const page = pdf.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  }
  const bytes = await pdf.save()
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}
