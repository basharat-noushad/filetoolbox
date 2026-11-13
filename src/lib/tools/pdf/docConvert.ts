// Office <-> PDF conversion that runs in the visitor's browser (vendor/doc-convert), with the Adobe-backed
// API routes as the fallback.
//
// The converter is a module Web Worker served from public/doc-convert/ (built on postinstall by
// scripts/build-doc-convert.mjs). It loads on first use, only the code for the conversion asked for,
// and the file never leaves the device. The online fallback uploads the file to our API route, which
// calls Adobe PDF Services (4 MB limit, monthly quota; see src/lib/adobe.ts).
//
// Scanned PDFs: with `ocr` (see ocr.ts) the worker sends each scanned page here as an image, the hook returns
// its words, and the pages become editable text. Messages from the worker are told apart by `type`:
// 'ocr' (a page to read), 'progress' ({ stage, page, pages }), none (the final result).

export type ConvertTarget = 'pdf' | 'docx' | 'xlsx' | 'pptx'

/** 'encrypted' | 'damaged' | 'unsupported' | 'unsupported-target' | 'empty' | 'too-large' | 'failed'
 *  | 'crashed' | 'timeout' | 'cancelled' (worker), or 'online' (the fallback route refused or failed) */
export class DocConvertError extends Error {
  constructor(public code: string, message: string, public detail?: string) {
    super(message)
    this.name = 'DocConvertError'
  }
}

import type { OcrImage, OcrResult } from './ocr'

export interface OcrProgress { stage: 'ocr'; page: number; pages: number }

export interface BrowserResult {
  blob: Blob
  ext: string
  from: string
  pages: number | null
  /** PDF input only: counts from the conversion (e.g. glyphs, textBoxes, images, scannedPages, ocrPages, scannedLikely) */
  stats: Record<string, number | boolean> | null
}

const WORKER_URL = '/doc-convert/worker.js'
const TIMEOUT_MS = 5 * 60 * 1000
/** the Adobe routes accept at most this (Vercel caps request bodies at 4.5 MB) */
export const ONLINE_MAX_BYTES = 4_000_000

type Pending = {
  resolve: (v: Record<string, unknown>) => void
  reject: (e: DocConvertError) => void
  cleanup: () => void
  /** an OCR or progress message: the worker is slow but alive, restart the time limit */
  alive: () => void
  ocr?: (image: OcrImage) => Promise<OcrResult | null>
  onProgress?: (p: OcrProgress) => void
}
type WorkerMessage = {
  id?: number; ok?: boolean; type?: string; code?: string; message?: string; detail?: string
  reqId?: number; image?: OcrImage; stage?: 'ocr'; page?: number; pages?: number
}
let worker: Worker | null = null
let seq = 0
const pending = new Map<number, Pending>()

// A conversion is synchronous work inside the worker, so stopping one means terminating the worker;
// the next call starts a fresh one.
function stop(err: DocConvertError) {
  worker?.terminate()
  worker = null
  for (const [id, p] of [...pending]) {
    pending.delete(id)
    p.cleanup()
    p.reject(err)
  }
}

function start(): Worker {
  if (worker) return worker
  const w = new Worker(WORKER_URL, { type: 'module' })
  worker = w
  w.onmessage = (e: MessageEvent) => {
    const { id, ok, ...rest } = (e.data || {}) as WorkerMessage
    const p = id === undefined ? undefined : pending.get(id)
    if (!p || id === undefined) return
    if (rest.type === 'progress') {
      p.alive()
      p.onProgress?.({ stage: 'ocr', page: Number(rest.page), pages: Number(rest.pages) })
      return
    }
    if (rest.type === 'ocr') {
      p.alive()
      const reply = (m: { result: OcrResult | null } | { error: string }) => {
        try { w.postMessage({ type: 'ocr-result', reqId: rest.reqId, ...m }) } catch (err) { w.postMessage({ type: 'ocr-result', reqId: rest.reqId, error: String(err) }) }
      }
      if (!p.ocr || !rest.image) { reply({ result: null }); return }
      p.ocr(rest.image).then((result) => reply({ result }), (err: unknown) => reply({ error: String((err as Error)?.message || err) }))
      return
    }
    pending.delete(id)
    p.cleanup()
    if (ok) p.resolve(rest)
    else p.reject(new DocConvertError(rest.code || 'failed', rest.message || 'The conversion failed.', rest.detail))
  }
  w.onerror = (e) => {
    if (w === worker) stop(new DocConvertError('crashed', 'The converter stopped unexpectedly.', e.message))
  }
  return w
}

/** Convert a file in the browser. Rejects with DocConvertError. */
export async function convertInBrowser(file: File, to: ConvertTarget, opts: {
  signal?: AbortSignal
  timeoutMs?: number
  /** reads scanned PDF pages (createOcrSession(lang).ocr); without it scans stay pictures */
  ocr?: (image: OcrImage) => Promise<OcrResult | null>
  onProgress?: (p: OcrProgress) => void
} = {}): Promise<BrowserResult> {
  const { signal, timeoutMs = TIMEOUT_MS, ocr, onProgress } = opts
  const cancelled = () => new DocConvertError('cancelled', 'The conversion was cancelled.')
  if (signal?.aborted) throw cancelled()
  if (typeof Worker === 'undefined') throw new DocConvertError('crashed', 'This browser cannot run the converter.')
  const bytes = await file.arrayBuffer()
  if (signal?.aborted) throw cancelled()
  const r = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const id = ++seq
    const onAbort = () => stop(cancelled())
    const expire = () => stop(new DocConvertError('timeout', 'This file is taking too long to convert.'))
    let timer = setTimeout(expire, timeoutMs)
    const alive = () => { clearTimeout(timer); timer = setTimeout(expire, timeoutMs) }
    signal?.addEventListener('abort', onAbort, { once: true })
    pending.set(id, { resolve, reject, alive, ocr, onProgress, cleanup: () => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort) } })
    try {
      const options = ocr ? { ocr: true } : {}
      start().postMessage({ id, op: 'convert', bytes, to, filename: file.name || '', options }, [bytes])
    } catch (e) {
      stop(new DocConvertError('crashed', 'The converter could not be started.', String(e)))
    }
  })
  return {
    blob: new Blob([r.data as ArrayBuffer], { type: r.mime as string }),
    ext: r.ext as string,
    from: r.from as string,
    pages: (r.pages as number | null) ?? null,
    stats: (r.stats as BrowserResult['stats']) ?? null,
  }
}

/** share of a PDF's pages that must be unread scans before the whole file is worth sending online */
const UNREAD_SHARE = 0.3

/**
 * True when the browser result is largely pictures where text should be, so the online converter is worth
 * trying: the PDF has almost no text at all, or at least UNREAD_SHARE of its pages are scans the browser
 * could not read. One unread picture page in a document that was otherwise converted (a photo, a title
 * slide whose words are part of the artwork) does not count: uploading the file would not help the rest.
 */
export function looksScanned(r: BrowserResult): boolean {
  const s = r.stats
  if (r.from !== 'pdf' || !s || s.scannedLikely !== true) return false
  if (s.sparseText === true) return true
  const pages = Number(s.pages) || 0
  const unread = Number(s.scannedPages || 0) - Number(s.ocrPages || 0)
  return pages > 0 ? unread / pages >= UNREAD_SHARE : true
}

/** The online fallback: POST the file to one of the Adobe-backed routes (/api/pdf-to-word, ...). */
export async function convertOnline(file: File, endpoint: string, signal?: AbortSignal): Promise<Blob> {
  if (file.size > ONLINE_MAX_BYTES) throw new DocConvertError('online', 'The online converter accepts files up to 4 MB.')
  const body = new FormData()
  body.append('file', file)
  let res: Response
  try {
    res = await fetch(endpoint, { method: 'POST', body, signal })
  } catch (e) {
    if (signal?.aborted) throw new DocConvertError('cancelled', 'The conversion was cancelled.')
    throw new DocConvertError('online', 'The online converter could not be reached. Check your connection and try again.', String(e))
  }
  if (!res.ok) {
    // These statuses carry a plain-text message written by our own API route.
    const text = [413, 415, 422, 429, 503, 504].includes(res.status) ? (await res.text()).slice(0, 300) : ''
    throw new DocConvertError('online', text || 'Conversion failed. Please try again.')
  }
  return res.blob()
}

/** Errors the online converter cannot help with either: show the message, don't upload the file. */
export const isFinal = (code: string) => ['encrypted', 'unsupported', 'unsupported-target', 'empty', 'cancelled'].includes(code)
