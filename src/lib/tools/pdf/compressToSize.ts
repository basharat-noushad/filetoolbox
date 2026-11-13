import { PDFDocument } from 'pdf-lib'
import { withPdf } from './pdfjs'
import { compressPdf } from './compress'

export interface SizeResult {
  blob: Blob
  /** true when blob.size <= target */
  reached: boolean
  /** true when the lossless re-save already met the target (text kept) */
  lossless: boolean
}

export interface Progress { pass: number; maxPasses: number; page: number; pages: number }

const MAX_PASSES = 6
const MIN_SCALE = 0.4
const MAX_SCALE = 1.6
const MIN_Q = 0.3
const MAX_Q = 0.8

const toJpeg = (canvas: HTMLCanvasElement, q: number) =>
  new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', q))

// One full rasterize + rebuild pass at a given scale/quality.
async function pass(
  file: File, scale: number, q: number, n: number, onProgress: (p: Progress) => void,
): Promise<Uint8Array> {
  return withPdf(file, async pdf => {
    const out = await PDFDocument.create()
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress({ pass: n, maxPasses: MAX_PASSES, page: i, pages: pdf.numPages })
      const page = await pdf.getPage(i)
      const base = page.getViewport({ scale: 1 }) // original size in points, rotation applied
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(viewport.width))
      canvas.height = Math.max(1, Math.floor(viewport.height))
      await page.render({ canvas, viewport, background: '#ffffff' }).promise
      const jpg = await toJpeg(canvas, q)
      canvas.width = 0; canvas.height = 0 // release bitmap memory
      page.cleanup()
      const img = await out.embedJpg(new Uint8Array(await jpg.arrayBuffer()))
      const p = out.addPage([base.width, base.height])
      p.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height })
      // yield so the progress UI can paint
      await new Promise(r => setTimeout(r, 0))
    }
    return out.save({ useObjectStreams: true })
  })
}

export async function compressToSize(
  file: File, targetBytes: number, onProgress: (p: Progress) => void,
): Promise<SizeResult> {
  // Lossless first: if it already fits, keep text/links intact.
  try {
    const lossless = await compressPdf(file)
    if (lossless.size <= targetBytes) return { blob: lossless, reached: true, lossless: true }
  } catch { /* encrypted/odd file: pdf.js below gives the real error */ }

  let scale = 1.2, q = 0.6
  let best: Blob | null = null      // largest result that fits
  let smallest: Blob | null = null  // fallback
  for (let n = 1; n <= MAX_PASSES; n++) {
    const bytes = await pass(file, scale, q, n, onProgress)
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
    if (!smallest || blob.size < smallest.size) smallest = blob
    if (blob.size <= targetBytes && (!best || blob.size > best.size)) best = blob
    // good enough: within 15% under target
    if (blob.size <= targetBytes && blob.size >= targetBytes * 0.85) break
    // Model: size ~ scale^2 * q^1.5. Aim slightly under target to land on the right side.
    const r = (targetBytes * 0.93) / blob.size
    let nq = Math.min(MAX_Q, Math.max(MIN_Q, q * Math.pow(r, 1 / 1.5)))
    const rest = r / Math.pow(nq / q, 1.5)
    let ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * Math.sqrt(rest)))
    if (r > 1) { nq = q; ns = Math.min(MAX_SCALE, scale * Math.sqrt(r)) } // room to spare: raise resolution only
    if (Math.abs(ns - scale) < 0.02 && Math.abs(nq - q) < 0.02) break // ladder exhausted
    scale = ns; q = nq
  }
  const blob = best ?? smallest!
  return { blob, reached: blob.size <= targetBytes, lossless: false }
}
