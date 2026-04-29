import JSZip from 'jszip'

export async function pdfToImages(file: File, format: 'jpeg' | 'png' = 'jpeg', quality = 0.92): Promise<Blob> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const zip = new JSZip()
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const ext  = format === 'jpeg' ? 'jpg' : 'png'
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas }).promise
    const base64 = canvas.toDataURL(mime, quality).split(',')[1]
    zip.file(`page_${String(i).padStart(3, '0')}.${ext}`, base64, { base64: true })
  }
  return zip.generateAsync({ type: 'blob' })
}
