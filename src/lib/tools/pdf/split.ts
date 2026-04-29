import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

export async function splitPdf(file: File, ranges: [number, number][]): Promise<Blob> {
  const source = await PDFDocument.load(await file.arrayBuffer())
  const zip = new JSZip()
  for (let i = 0; i < ranges.length; i++) {
    const [start, end] = ranges[i]
    const out = await PDFDocument.create()
    const indices = Array.from({ length: end - start + 1 }, (_, k) => start + k - 1)
    const pages = await out.copyPages(source, indices)
    pages.forEach(p => out.addPage(p))
    const bytes = await out.save()
    zip.file(`part_${i + 1}.pdf`, bytes.buffer as ArrayBuffer)
  }
  return zip.generateAsync({ type: 'blob' })
}
