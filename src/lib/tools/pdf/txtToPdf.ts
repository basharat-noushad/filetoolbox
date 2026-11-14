import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'

export interface TxtToPdfOptions { pageSize: 'a4' | 'letter'; fontSize: number; margin: number /* points */ }
export interface TxtToPdfResult { blob: Blob; pages: number; replaced: string[] }

const SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const
// characters Helvetica (WinAnsi) can draw; anything else switches to the embedded DejaVu Sans
const NEEDS_UNICODE = /[^\n\x20-\x7e\xa0-\xff]/

async function loadFont(pdf: PDFDocument, text: string): Promise<PDFFont> {
  if (!NEEDS_UNICODE.test(text)) return pdf.embedFont(StandardFonts.Helvetica)
  // @ts-expect-error fontkit ships no type declarations
  const [fontkit, res] = await Promise.all([import('fontkit'), fetch('/doc-convert/fonts/DejaVuSans.ttf')])
  if (!res.ok) throw new Error('font')
  pdf.registerFontkit(fontkit as unknown as Parameters<PDFDocument['registerFontkit']>[0])
  return pdf.embedFont(await res.arrayBuffer(), { subset: false }) // ponytail: fontkit 2's subsetter lacks encodeStream (pdf-lib needs @pdf-lib/fontkit); full font adds ~0.4 MB
}

export async function txtToPdf(raw: string, o: TxtToPdfOptions): Promise<TxtToPdfResult> {
  let text = raw.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
  const pdf = await PDFDocument.create()
  let font: PDFFont
  let unicode = NEEDS_UNICODE.test(text)
  try { font = await loadFont(pdf, text) } catch {
    // font file unavailable: Helvetica fallback, unsupported characters become "?"
    unicode = false
    font = await pdf.embedFont(StandardFonts.Helvetica)
  }
  // swap characters the chosen font cannot draw, and report them
  const replaced = new Set<string>()
  const supported = unicode ? new Set(font.getCharacterSet()) : null
  text = Array.from(text, ch => {
    const cp = ch.codePointAt(0)!
    if (ch === '\n' || (supported ? supported.has(cp) : !NEEDS_UNICODE.test(ch))) return ch
    replaced.add(ch)
    return '?'
  }).join('')

  const [pw, ph] = SIZES[o.pageSize]
  const maxW = pw - o.margin * 2
  const lead = o.fontSize * 1.4
  const width = (s: string) => font.widthOfTextAtSize(s, o.fontSize)

  const wrapped: string[] = []
  for (const para of text.split('\n')) {
    if (para === '') { wrapped.push(''); continue }
    let line = ''
    // split into whitespace / word runs so indentation survives
    for (const word of para.match(/\s+|\S+/g)!) {
      if (width(line + word) <= maxW) { line += word; continue }
      if (/^\s+$/.test(word)) continue // wrap point: drop trailing whitespace
      if (line.trim()) { wrapped.push(line.trimEnd()); line = '' }
      // word longer than a whole line: break by character
      let piece = ''
      for (const ch of word) {
        if (width(piece + ch) > maxW && piece) { wrapped.push(piece); piece = '' }
        piece += ch
      }
      line = piece
    }
    wrapped.push(line.trimEnd())
  }

  const perPage = Math.max(1, Math.floor((ph - o.margin * 2) / lead))
  const pageCount = Math.max(1, Math.ceil(wrapped.length / perPage))
  for (let p = 0; p < pageCount; p++) {
    const page = pdf.addPage([pw, ph])
    wrapped.slice(p * perPage, (p + 1) * perPage).forEach((l, i) => {
      if (!l) return
      // ponytail: mostly right-to-left lines (Arabic, Urdu, Hebrew) are right-aligned; fontkit shapes and orders the glyphs.
      // Mixed LTR/RTL lines are not reordered properly.
      const rtl = (l.match(/[֐-ࣿיִ-﷿ﹰ-﻿]/g)?.length ?? 0) > l.length / 3
      const txt = l
      page.drawText(txt, { x: rtl ? pw - o.margin - width(txt) : o.margin, y: ph - o.margin - o.fontSize - i * lead, size: o.fontSize, font, color: rgb(0, 0, 0) })
    })
  }
  return { blob: new Blob([(await pdf.save()) as BlobPart], { type: 'application/pdf' }), pages: pageCount, replaced: [...replaced] }
}
