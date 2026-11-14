import { PDFDocument, EncryptedPDFError } from 'pdf-lib'
import JSZip from 'jszip'

export interface SplitPart {
  name: string
  /** 1-based inclusive page range */
  from: number
  to: number
  bytes: Uint8Array
  /** true when a single page alone is larger than the requested max size */
  oversized?: boolean
}

export class SplitError extends Error {
  code: 'encrypted' | 'range' | 'failed'
  constructor(code: 'encrypted' | 'range' | 'failed', msg: string) { super(msg); this.code = code }
}

export type Progress = (donePages: number, totalPages: number) => void

const tick = () => new Promise<void>(r => setTimeout(r, 0))

async function loadSource(file: File): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(await file.arrayBuffer())
  } catch (e) {
    if (e instanceof EncryptedPDFError) {
      throw new SplitError('encrypted', 'This PDF is password-protected. Remove the password with Unlock PDF first, then split it.')
    }
    throw new SplitError('failed', 'Could not read this PDF. It may be damaged.')
  }
}

/** Copy 1-based inclusive [from, to] into a fresh doc in ONE copyPages call so shared fonts/images stay shared. */
async function buildPart(source: PDFDocument, from: number, to: number): Promise<Uint8Array> {
  const out = await PDFDocument.create()
  const pages = await out.copyPages(source, Array.from({ length: to - from + 1 }, (_, k) => from - 1 + k))
  pages.forEach(p => out.addPage(p))
  return out.save()
}

export async function splitByRanges(file: File, ranges: [number, number][], onProgress?: Progress): Promise<SplitPart[]> {
  const source = await loadSource(file)
  const total = source.getPageCount()
  const bad = ranges.find(([, b]) => b > total)
  if (bad) throw new SplitError('range', `This PDF has only ${total} page${total === 1 ? '' : 's'}, but a range goes up to page ${bad[1]}.`)
  const parts: SplitPart[] = []
  let done = 0
  for (let i = 0; i < ranges.length; i++) {
    const [from, to] = ranges[i]
    parts.push({ name: `part_${i + 1}.pdf`, from, to, bytes: await buildPart(source, from, to) })
    done += to - from + 1
    onProgress?.(Math.min(done, total), total)
    await tick()
  }
  return parts
}

export async function splitEveryN(file: File, n: number, onProgress?: Progress): Promise<SplitPart[]> {
  const source = await loadSource(file)
  const total = source.getPageCount()
  const parts: SplitPart[] = []
  for (let from = 1; from <= total; from += n) {
    const to = Math.min(from + n - 1, total)
    parts.push({ name: `part_${parts.length + 1}.pdf`, from, to, bytes: await buildPart(source, from, to) })
    onProgress?.(to, total)
    await tick()
  }
  return parts
}

/**
 * Greedy split so every part <= maxBytes (a lone page that exceeds it is emitted alone, flagged oversized).
 * Per part: guess a page count from the average page size, build+save, then rescale the count by
 * maxBytes/actual and retry (a few saves per part, never O(n^2)). Every emitted part is a verified real save.
 */
export async function splitBySize(file: File, maxBytes: number, onProgress?: Progress): Promise<SplitPart[]> {
  const source = await loadSource(file)
  const total = source.getPageCount()
  const avg = Math.max(1, file.size / total)
  const parts: SplitPart[] = []
  let start = 1
  while (start <= total) {
    const remaining = total - start + 1
    let c = Math.max(1, Math.min(remaining, Math.floor(maxBytes / avg)))
    let best: { c: number; bytes: Uint8Array } | null = null
    let badAt = Infinity // smallest count known to be too big
    for (let tries = 0; ; tries++) {
      const bytes = await buildPart(source, start, start + c - 1)
      if (bytes.length <= maxBytes) {
        if (!best || c > best.c) best = { c, bytes }
        const grown = Math.min(Math.floor(c * maxBytes / bytes.length * 0.99), remaining, badAt - 1)
        if (grown <= c || tries >= 6) break
        c = grown
      } else if (c === 1) {
        // single page alone exceeds the limit
        parts.push({ name: '', from: start, to: start, bytes, oversized: true })
        best = null
        break
      } else {
        badAt = Math.min(badAt, c)
        const shrunk = Math.floor(c * maxBytes / bytes.length * 0.98)
        c = Math.max(1, Math.min(shrunk, c - 1))
        if (best && c <= best.c) break
        // after many tries fall back to halving so we always terminate quickly
        if (tries >= 6) c = Math.max(1, Math.floor(c / 2))
      }
      await tick()
    }
    if (best) parts.push({ name: '', from: start, to: start + best.c - 1, bytes: best.bytes })
    start = parts[parts.length - 1].to + 1
    onProgress?.(start - 1, total)
    await tick()
  }
  parts.forEach((p, i) => { p.name = `part_${i + 1}.pdf` })
  return parts
}

/** One part -> plain PDF; several -> ZIP. */
export async function packParts(parts: SplitPart[]): Promise<{ blob: Blob; filename: string }> {
  if (parts.length === 1) {
    return { blob: new Blob([parts[0].bytes as BlobPart], { type: 'application/pdf' }), filename: 'split.pdf' }
  }
  const zip = new JSZip()
  parts.forEach(p => zip.file(p.name, p.bytes))
  return { blob: await zip.generateAsync({ type: 'blob' }), filename: 'split.zip' }
}

/** Back-compat: ranges -> ZIP. */
export async function splitPdf(file: File, ranges: [number, number][]): Promise<Blob> {
  const parts = await splitByRanges(file, ranges)
  const zip = new JSZip()
  parts.forEach(p => zip.file(p.name, p.bytes))
  return zip.generateAsync({ type: 'blob' })
}
