// Reads scanned PDF pages for the in-browser converter (docConvert.ts): the converter's worker sends each
// scanned page as an image and gets the recognised words back.
//
// Tesseract.js is imported on the first page that needs reading, so conversions without scans never
// download it. One Tesseract worker serves a whole conversion and must be ended with end(). The worker,
// cores and English data are served from public/tesseract/ (copied there by scripts/copy-wasm.cjs); other
// languages come from Tesseract.js's default CDN, as in the OCR PDF tool.

import type { Worker as TesseractWorker } from 'tesseract.js'

export interface OcrBox { x0: number; y0: number; x1: number; y1: number }
export interface OcrImage { bytes: Uint8Array; format: 'png' | 'jpg'; width: number; height: number; page: number; pages: number }
export interface OcrResult { lines: { bbox: OcrBox; words: { text: string; bbox: OcrBox; confidence: number }[] }[] }

export interface OcrSession {
  /** the converter's ocr hook: one image -> its words (null when nothing was found) */
  ocr: (image: OcrImage) => Promise<OcrResult | null>
  /** terminate the Tesseract worker (safe to call more than once, or when nothing was read) */
  end: () => Promise<void>
}

const ASSETS = '/tesseract/'

export function createOcrSession(lang: string): OcrSession {
  let ready: Promise<TesseractWorker> | null = null
  let ended = false

  const start = async (): Promise<TesseractWorker> => {
    const T = await import('tesseract.js')
    const base = new URL(ASSETS, window.location.href).href
    // Tesseract.js reports a failed language download only through errorHandler (createWorker never settles)
    let fail: (e: unknown) => void = () => {}
    const failed = new Promise<never>((_, reject) => { fail = reject })
    failed.catch(() => {})
    const created = T.createWorker(lang, T.OEM.LSTM_ONLY, {
      workerPath: `${base}worker.min.js`,
      workerBlobURL: false,
      corePath: `${base}core`, // a folder: Tesseract.js picks the relaxed-SIMD, SIMD or plain LSTM core
      ...(lang === 'eng' ? { langPath: `${base}lang` } : {}),
      errorHandler: (e: unknown) => fail(e),
    })
    try {
      const w = await Promise.race([created, failed])
      // automatic page segmentation; Tesseract.js's default (one uniform block) loses most of a page
      // with columns or tables
      await w.setParameters({ tessedit_pageseg_mode: T.PSM.AUTO })
      return w
    } catch (e) {
      void created.then((w) => w.terminate(), () => {})
      throw e
    }
  }

  const ocr = async (image: OcrImage): Promise<OcrResult | null> => {
    if (ended) throw new Error('OCR session ended')
    ready ||= start()
    const w = await ready // a failed start stays failed: every later page fails fast instead of retrying
    const { data } = await w.recognize(new Blob([image.bytes as BlobPart], { type: `image/${image.format === 'jpg' ? 'jpeg' : 'png'}` }), {}, { blocks: true, text: false })
    const lines: OcrResult['lines'] = []
    for (const b of data.blocks || []) for (const p of b.paragraphs) for (const l of p.lines) {
      lines.push({ bbox: l.bbox, words: l.words.map((wd) => ({ text: wd.text, bbox: wd.bbox, confidence: wd.confidence })) })
    }
    return lines.length ? { lines } : null
  }

  const end = async () => {
    ended = true
    const r = ready
    ready = null
    if (r) await r.then((w) => w.terminate(), () => {})
  }

  return { ocr, end }
}
