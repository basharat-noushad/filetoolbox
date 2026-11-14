// OCR for a single image. Mirrors the self-hosted Tesseract setup in lib/tools/pdf/ocr.ts (worker, cores and
// English data from public/tesseract; other languages come from Tesseract.js's default CDN, as in OCR PDF).
export async function imageToText(file: Blob, lang: string, onProgress: (pct: number, status: string) => void): Promise<string> {
  const T = await import('tesseract.js')
  const base = new URL('/tesseract/', window.location.href).href
  // decode via canvas -> PNG so WebP, EXIF-rotated and odd formats all reach Tesseract as plain PNG
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = bmp.width; canvas.height = bmp.height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height) // transparent PNGs need a solid background
  ctx.drawImage(bmp, 0, 0); bmp.close()
  const png = await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('encode'))), 'image/png'))

  let fail: (e: unknown) => void = () => {}
  const failed = new Promise<never>((_, reject) => { fail = reject })
  failed.catch(() => {})
  const created = T.createWorker(lang, T.OEM.LSTM_ONLY, {
    workerPath: `${base}worker.min.js`,
    workerBlobURL: false,
    corePath: `${base}core`,
    ...(lang === 'eng' ? { langPath: `${base}lang` } : {}),
    errorHandler: (e: unknown) => fail(e),
    logger: (m: { status: string; progress: number }) => onProgress(Math.round(m.progress * 100), m.status),
  })
  try {
    const w = await Promise.race([created, failed])
    try {
      await w.setParameters({ tessedit_pageseg_mode: T.PSM.AUTO })
      const { data } = await Promise.race([w.recognize(png), failed])
      return data.text.trim()
    } finally { await w.terminate() }
  } catch (e) {
    void created.then(w => w.terminate(), () => {})
    throw e
  }
}
