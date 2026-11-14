import { withPdf } from './pdfjs'

export interface PdfTextResult { pages: string[]; chars: number }
export class PdfTextError extends Error {
  code: 'encrypted' | 'failed'
  constructor(code: 'encrypted' | 'failed', msg: string) { super(msg); this.code = code }
}

interface Item { str: string; x: number; y: number; w: number; fs: number }

/** Rebuild readable lines from pdf.js text items: group on y, sort on x, add spaces from gaps, blank line between paragraphs. */
function pageToText(items: Item[]): string {
  const sorted = items.filter(i => i.str.trim() !== '').sort((a, b) => b.y - a.y || a.x - b.x)
  const lines: Item[][] = []
  for (const it of sorted) {
    const last = lines[lines.length - 1]
    const ref = last?.[0]
    // ponytail: simple y-bucketing; multi-column pages interleave columns on shared baselines
    if (ref && Math.abs(ref.y - it.y) <= Math.max(2, Math.min(ref.fs, it.fs || ref.fs) * 0.5)) last.push(it)
    else lines.push([it])
  }
  let out = ''
  let prevY: number | null = null
  for (const line of lines) {
    line.sort((a, b) => a.x - b.x)
    let s = ''
    let end: number | null = null
    for (const it of line) {
      if (end !== null && it.str.trim() !== '') {
        const gap = it.x - end
        if (gap > Math.max(it.fs, 1) * 0.15 && !/\s$/.test(s) && !/^\s/.test(it.str)) s += gap > it.fs * 3 ? '   ' : ' '
      }
      s += it.str
      end = Math.max(end ?? -Infinity, it.x + it.w)
    }
    s = s.replace(/\s+$/, '')
    if (!s) continue
    const fs = Math.max(...line.map(i => i.fs), 1)
    if (prevY !== null) out += prevY - line[0].y > fs * 1.8 ? '\n\n' : '\n'
    out += s
    prevY = line[0].y
  }
  return out
}

export async function pdfToText(file: File): Promise<PdfTextResult> {
  try {
    return await withPdf(file, async pdf => {
      const pages: string[] = []
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n)
        const tc = await page.getTextContent()
        const items: Item[] = []
        for (const it of tc.items) {
          if (!('str' in it)) continue
          items.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, fs: Math.hypot(it.transform[2], it.transform[3]) || it.height })
        }
        pages.push(pageToText(items))
        page.cleanup()
      }
      return { pages, chars: pages.reduce((n, p) => n + p.replace(/\s/g, '').length, 0) }
    })
  } catch (e) {
    if ((e as { name?: string })?.name === 'PasswordException') throw new PdfTextError('encrypted', 'This PDF is password-protected.')
    throw new PdfTextError('failed', 'Could not read this PDF. It may be damaged.')
  }
}

export function joinPages(pages: string[], separators: boolean): string {
  return pages.map((p, i) => (separators ? `--- Page ${i + 1} ---\n` : '') + p).join('\n\n').trim() + '\n'
}
