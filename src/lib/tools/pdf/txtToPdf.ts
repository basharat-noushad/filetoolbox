import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'

export interface TxtToPdfOptions { pageSize: 'a4' | 'letter'; fontSize: number; margin: number /* points */ }
export interface TxtToPdfResult { blob: Blob; pages: number; replaced: string[] }

const SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const

type Key = 'latin' | 'arabic' | 'deva' | 'cjk'
const FILES = {
  arabic: 'NotoNaskhArabic-Regular.ttf', deva: 'NotoSansDevanagari-Regular.ttf', cjk: 'NotoSansSC-Regular.ttf', sans: 'NotoSans-Regular.ttf',
} as const
const WINANSI = /^[\x20-\x7e\xa0-\xff]$/

// script of a code point; 'neutral' (space, digits, punctuation) joins the surrounding run
function script(cp: number): Key | 'neutral' {
  if (cp >= 0x30 && cp <= 0x39) return 'latin' // ASCII digits stay left-to-right, even inside Arabic text
  if (cp === 0x60c || cp === 0x61b || cp === 0x61f || (cp >= 0x660 && cp <= 0x669)) return 'neutral'
  if ((cp >= 0x600 && cp <= 0x6ff) || (cp >= 0x750 && cp <= 0x77f) || (cp >= 0x8a0 && cp <= 0x8ff) || (cp >= 0xfb50 && cp <= 0xfdff) || (cp >= 0xfe70 && cp <= 0xfeff)) return 'arabic'
  if (cp >= 0x900 && cp <= 0x97f) return 'deva'
  if ((cp >= 0x3001 && cp <= 0x9fff) || (cp >= 0x2e80 && cp < 0x3000) || (cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xff00 && cp <= 0xffef) || (cp >= 0x20000 && cp <= 0x2ffff)) return 'cjk'
  if (cp <= 0x40 || (cp >= 0x5b && cp <= 0x60) || (cp >= 0x7b && cp <= 0x7e) || cp === 0x3000 || (cp >= 0x2000 && cp <= 0x206f)) return 'neutral'
  return 'latin'
}

// @pdf-lib/fontkit's subsetter writes a short 'loca' table without halving the offsets, which corrupts every
// glyph after the first few. Force the long (32-bit byte offset) format, which its encoder already writes correctly.
async function patchedFontkit() {
  const fk = (await import('@pdf-lib/fontkit')).default
  return {
    create: (data: Uint8Array) => {
      const font = fk.create(data) as unknown as { createSubset: () => object }
      const make = font.createSubset.bind(font)
      font.createSubset = () => {
        const sub = make()
        let loca: { version?: number } | undefined
        Object.defineProperty(sub, 'loca', { get: () => loca, set: v => { loca = v; if (loca) loca.version = 1 } })
        return sub
      }
      return font
    },
  } as unknown as Parameters<PDFDocument['registerFontkit']>[0]
}

async function fetchFont(pdf: PDFDocument, file: string): Promise<PDFFont> {
  const res = await fetch(`/fonts/${file}`)
  if (!res.ok) throw new Error('font')
  return pdf.embedFont(await res.arrayBuffer(), { subset: true })
}

interface Ch { c: string; f: Key }

export async function txtToPdf(raw: string, o: TxtToPdfOptions): Promise<TxtToPdfResult> {
  const text = raw.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
  const pdf = await PDFDocument.create()
  const chars = Array.from(text)

  // which fonts does this text need? (only those are fetched and embedded)
  const need = new Set<'arabic' | 'deva' | 'cjk' | 'sans'>()
  for (const c of chars) {
    if (c === '\n') continue
    const s = script(c.codePointAt(0)!)
    if (s === 'arabic' || s === 'deva' || s === 'cjk') need.add(s)
    else if (!WINANSI.test(c) && s === 'latin') need.add('sans') // Latin extended, Cyrillic, Greek...
  }
  if (need.size) {
    // fontkit's Indic shaper (Devanagari) needs a global regeneratorRuntime; Next ships one
    const g = globalThis as { regeneratorRuntime?: unknown }
    // @ts-expect-error next's compiled runtime has no type declarations
    if (!g.regeneratorRuntime) { const r = await import('next/dist/compiled/regenerator-runtime'); g.regeneratorRuntime = r.default ?? r }
    pdf.registerFontkit(await patchedFontkit())
  }
  const helv = await pdf.embedFont(StandardFonts.Helvetica)
  const fonts: Partial<Record<Key, PDFFont>> = { latin: helv }
  let fontFailed = false
  await Promise.all([...need].map(async k => {
    try {
      const f = await fetchFont(pdf, FILES[k])
      fonts[k === 'sans' ? 'latin' : k] = f
    } catch { fontFailed = true }
  }))
  if (fontFailed) throw new Error('font')

  const charsets = new Map<PDFFont, Set<number>>()
  const has = (k: Key, c: string) => {
    const f = fonts[k]
    if (!f) return false
    if (f === helv) return WINANSI.test(c)
    let s = charsets.get(f)
    if (!s) charsets.set(f, s = new Set(f.getCharacterSet()))
    return s.has(c.codePointAt(0)!)
  }

  // tag every character with a font; neutrals follow the previous character's font
  const replaced = new Set<string>()
  const tagged: Ch[] = []
  let prev: Key = 'latin'
  for (const c of chars) {
    if (c === '\n') { tagged.push({ c, f: 'latin' }); prev = 'latin'; continue }
    const s = script(c.codePointAt(0)!)
    let k: Key = s === 'neutral' ? prev : s
    if (!has(k, c)) k = (['latin', 'arabic', 'deva', 'cjk'] as Key[]).find(x => has(x, c)) ?? k
    if (!has(k, c)) { replaced.add(c); tagged.push({ c: '?', f: 'latin' }); continue }
    tagged.push({ c, f: k })
    if (s !== 'neutral') prev = k
  }

  const [pw, ph] = SIZES[o.pageSize]
  const maxW = pw - o.margin * 2
  const lead = o.fontSize * 1.4
  const runs = (l: Ch[]) => {
    const out: { f: Key; t: string }[] = []
    for (const { c, f } of l) { const r = out[out.length - 1]; if (r && r.f === f) r.t += c; else out.push({ f, t: c }) }
    return out
  }
  const runW = (r: { f: Key; t: string }) => fonts[r.f]!.widthOfTextAtSize(r.t, o.fontSize)
  const width = (l: Ch[]) => runs(l).reduce((w, r) => w + runW(r), 0)
  const trimEnd = (l: Ch[]) => { let n = l.length; while (n && /\s/.test(l[n - 1].c)) n--; return l.slice(0, n) }

  const paras: Ch[][] = [[]]
  for (const ch of tagged) { if (ch.c === '\n') paras.push([]); else paras[paras.length - 1].push(ch) }
  const wrapped: Ch[][] = []
  for (const para of paras) {
    if (!para.length) { wrapped.push([]); continue }
    // split into whitespace / word runs so indentation survives
    const words: Ch[][] = []
    let cur: Ch[] = [], curWs = false
    for (const ch of para) {
      const ws = /\s/.test(ch.c)
      if (cur.length && ws !== curWs) { words.push(cur); cur = [] }
      cur.push(ch); curWs = ws
    }
    words.push(cur)
    let line: Ch[] = []
    for (const word of words) {
      if (width([...line, ...word]) <= maxW) { line.push(...word); continue }
      if (/^\s/.test(word[0].c)) continue // wrap point: drop trailing whitespace
      if (line.some(l => l.c.trim())) { wrapped.push(trimEnd(line)); line = [] }
      // word longer than a whole line (or CJK without spaces): break by character
      let piece: Ch[] = []
      for (const ch of word) {
        if (piece.length && width([...piece, ch]) > maxW) { wrapped.push(piece); piece = [] }
        piece.push(ch)
      }
      line = piece
    }
    wrapped.push(trimEnd(line))
  }

  const perPage = Math.max(1, Math.floor((ph - o.margin * 2) / lead))
  const pageCount = Math.max(1, Math.ceil(wrapped.length / perPage))
  for (let p = 0; p < pageCount; p++) {
    const page = pdf.addPage([pw, ph])
    wrapped.slice(p * perPage, (p + 1) * perPage).forEach((l, i) => {
      if (!l.length) return
      // ponytail: lines starting with Arabic script are right-aligned and their runs laid out right-to-left;
      // a run-level reorder (digits in Arabic-Indic form may come out reversed), not the full Unicode bidi algorithm (nested numbers/brackets may misorder).
      const first = l.find(x => !/[\s\p{P}\d]/u.test(x.c))
      const rtl = first?.f === 'arabic' // paragraph direction = first strong character
      let r = runs(l)
      if (rtl) r = r.reverse()
      let x = rtl ? pw - o.margin - width(l) : o.margin
      const y = ph - o.margin - o.fontSize - i * lead
      for (const run of r) {
        page.drawText(run.t, { x, y, size: o.fontSize, font: fonts[run.f]!, color: rgb(0, 0, 0) })
        x += runW(run)
      }
    })
  }
  return { blob: new Blob([(await pdf.save()) as BlobPart], { type: 'application/pdf' }), pages: pageCount, replaced: [...replaced] }
}
