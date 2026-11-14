import QRCode from 'qrcode'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import type { CornerDotType, CornerSquareType, DotType, Options } from 'qr-code-styling'
import { contrastRatio, type QrEcc } from './qr'
import { decodeBlob } from './qrDecode'

export type FrameStyle = 'none' | 'bottom' | 'top' | 'outline'
export interface QrDesign {
  dotStyle: DotType; dotColor: string
  gradient: boolean; gradType: 'linear' | 'radial'; gradColor2: string; gradAngle: number
  cornerSquareStyle: CornerSquareType; cornerSquareColor: string | null
  cornerDotStyle: CornerDotType; cornerDotColor: string | null
  bg: string; bgTransparent: boolean; margin: number; ecc: QrEcc
  logo: string | null; logoSize: number; hideLogoDots: boolean; logoMargin: number
  frame: FrameStyle; frameText: string; frameColor: string
}

export const defaultDesign: QrDesign = {
  dotStyle: 'square', dotColor: '#000000', gradient: false, gradType: 'linear', gradColor2: '#2563eb', gradAngle: 45,
  cornerSquareStyle: 'square', cornerSquareColor: null, cornerDotStyle: 'square', cornerDotColor: null,
  bg: '#ffffff', bgTransparent: false, margin: 4, ecc: 'M',
  logo: null, logoSize: 0.25, hideLogoDots: true, logoMargin: 4,
  frame: 'none', frameText: 'Scan me', frameColor: '#111827',
}

export const MAX_PX = 4000
export const MAX_BULK = 500

const eccOf = (d: QrDesign): QrEcc => (d.logo ? 'H' : d.ecc)

function options(data: string, d: QrDesign, size: number, type: 'canvas' | 'svg'): Options {
  const ecc = eccOf(d)
  const n = QRCode.create(data, { errorCorrectionLevel: ecc }).modules.size
  const margin = Math.round((d.margin * size) / (n + 2 * d.margin))
  const gradient = d.gradient ? {
    type: d.gradType, rotation: (d.gradAngle * Math.PI) / 180,
    colorStops: [{ offset: 0, color: d.dotColor }, { offset: 1, color: d.gradColor2 }],
  } : undefined
  const fill = (c: string | null) => (c ? { color: c } : gradient ? { gradient } : { color: d.dotColor })
  return {
    type, width: size, height: size, margin,
    // qr-code-styling writes one byte per char, so hand it UTF-8 bytes as chars (otherwise accents/emoji break)
    data: unescape(encodeURIComponent(data)),
    qrOptions: { errorCorrectionLevel: ecc },
    dotsOptions: { type: d.dotStyle, ...(gradient ? { gradient } : { color: d.dotColor }) },
    cornersSquareOptions: { type: d.cornerSquareStyle, ...fill(d.cornerSquareColor) },
    cornersDotOptions: { type: d.cornerDotStyle, ...fill(d.cornerDotColor) },
    backgroundOptions: { color: d.bgTransparent ? 'transparent' : d.bg },
    image: d.logo ?? undefined,
    imageOptions: { hideBackgroundDots: d.hideLogoDots, imageSize: d.logoSize, margin: Math.round((d.logoMargin * size) / 512), crossOrigin: 'anonymous' },
  }
}

async function rawQr(data: string, d: QrDesign, size: number, ext: 'png' | 'svg'): Promise<Blob> {
  const { default: QRCodeStyling } = await import('qr-code-styling')
  const q = new QRCodeStyling(options(data, d, size, ext === 'svg' ? 'svg' : 'canvas'))
  const b = await q.getRawData(ext)
  if (!b || !(b instanceof Blob)) throw new Error('QR render failed')
  return b
}

// ---- frame geometry (shared by canvas and SVG) ----
function geom(d: QrDesign, total: number) {
  if (d.frame === 'none') return { q: total, pad: 0, band: 0, W: total, H: total, qx: 0, qy: 0, ty: 0 }
  const q = Math.round(total / 1.12), pad = Math.round(q * 0.06), band = Math.round(q * 0.17)
  const top = d.frame === 'top'
  return {
    q, pad, band, W: q + 2 * pad, H: q + 2 * pad + band, qx: pad, qy: pad + (top ? band : 0),
    ty: top ? (pad + band) / 2 : pad + q + (pad + band) / 2,
  }
}
const fontSize = (text: string, band: number, W: number) => Math.max(8, Math.min(band * 0.5, (W * 0.88) / (Math.max(1, text.length) * 0.62)))
const textColor = (fill: string) => (contrastRatio(fill, '#ffffff') >= contrastRatio(fill, '#000000') ? '#ffffff' : '#000000')
const xml = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const FONT = 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif'

/** Final raster artwork (QR + optional frame), total width = size. */
export async function renderPng(data: string, d: QrDesign, size: number): Promise<Blob> {
  const g = geom(d, size)
  const qr = await rawQr(data, d, g.q, 'png')
  if (d.frame === 'none') return qr
  const bmp = await createImageBitmap(qr)
  const c = document.createElement('canvas'); c.width = g.W; c.height = g.H
  const ctx = c.getContext('2d')!
  const filled = d.frame !== 'outline'
  const sw = Math.max(2, g.pad * 0.35)
  ctx.fillStyle = filled ? d.frameColor : '#ffffff'
  ctx.beginPath(); ctx.roundRect(0, 0, g.W, g.H, g.pad); ctx.fill()
  if (!filled) {
    ctx.strokeStyle = d.frameColor; ctx.lineWidth = sw
    ctx.beginPath(); ctx.roundRect(sw / 2, sw / 2, g.W - sw, g.H - sw, g.pad); ctx.stroke()
  }
  ctx.fillStyle = '#ffffff'; ctx.fillRect(g.qx, g.qy, g.q, g.q)
  ctx.drawImage(bmp, g.qx, g.qy, g.q, g.q); bmp.close()
  ctx.font = `700 ${fontSize(d.frameText, g.band, g.W)}px ${FONT}`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = filled ? textColor(d.frameColor) : d.frameColor
  ctx.fillText(d.frameText, g.W / 2, g.ty)
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'))
}

export async function renderSvg(data: string, d: QrDesign, size: number): Promise<Blob> {
  const g = geom(d, size)
  let svg = await (await rawQr(data, d, g.q, 'svg')).text()
  svg = svg.replace(/<\?xml[^>]*\?>/, '')
  if (d.frame === 'none') return new Blob([svg], { type: 'image/svg+xml' })
  const filled = d.frame !== 'outline'
  const sw = Math.max(2, g.pad * 0.35)
  const body = (filled
    ? `<rect width="${g.W}" height="${g.H}" rx="${g.pad}" fill="${d.frameColor}"/>`
    : `<rect width="${g.W}" height="${g.H}" rx="${g.pad}" fill="#fff"/><rect x="${sw / 2}" y="${sw / 2}" width="${g.W - sw}" height="${g.H - sw}" rx="${g.pad}" fill="none" stroke="${d.frameColor}" stroke-width="${sw}"/>`)
    + `<rect x="${g.qx}" y="${g.qy}" width="${g.q}" height="${g.q}" fill="#fff"/>${svg.replace(/<svg /, `<svg x="${g.qx}" y="${g.qy}" `)}`
    + `<text x="${g.W / 2}" y="${g.ty}" text-anchor="middle" dominant-baseline="central" font-family="${FONT.replace(/"/g, "'")}" font-weight="700" font-size="${fontSize(d.frameText, g.band, g.W)}" fill="${filled ? textColor(d.frameColor) : d.frameColor}">${xml(d.frameText)}</text>`
  return new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${g.W}" height="${g.H}" viewBox="0 0 ${g.W} ${g.H}">${body}</svg>`], { type: 'image/svg+xml' })
}

export async function renderJpg(data: string, d: QrDesign, size: number): Promise<Blob> {
  const bmp = await createImageBitmap(await renderPng(data, d, size))
  const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(bmp, 0, 0); bmp.close()
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('JPG export failed'))), 'image/jpeg', 0.95))
}

export type PrintUnit = 'cm' | 'in'
/** Raster PDF at 300 DPI (capped at 4000 px); the page is exactly the requested width (frame included). */
export async function renderPdf(data: string, d: QrDesign, printWidth: number, unit: PrintUnit): Promise<Blob> {
  const inches = unit === 'cm' ? printWidth / 2.54 : printWidth
  const px = Math.min(MAX_PX, Math.max(300, Math.round(inches * 300)))
  const png = await renderPng(data, d, px)
  const bmp = await createImageBitmap(png)
  const wPt = inches * 72, hPt = wPt * (bmp.height / bmp.width)
  bmp.close()
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([wPt, hPt])
  page.drawImage(await pdf.embedPng(new Uint8Array(await png.arrayBuffer())), { x: 0, y: 0, width: wPt, height: hPt })
  return new Blob([(await pdf.save()) as BlobPart], { type: 'application/pdf' })
}

/** True when the rendered image decodes back to exactly the expected payload. */
export async function verifyScan(png: Blob, expected: string): Promise<boolean> {
  return (await decodeBlob(png, false)) === expected
}

// ---- bulk ----
export interface BulkRow { name: string; value: string }

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch !== '"') cur += ch
      else if (line[i + 1] === '"') { cur += '"'; i++ } else q = false
    } else if (ch === '"') q = true
    else if (ch === ',') { out.push(cur); cur = '' } else cur += ch
  }
  return [...out, cur]
}

/** One value per line, or a CSV with a header containing url/text/value/content (+ optional name/filename). */
export function parseBulk(text: string): { rows: BulkRow[]; truncated: boolean } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (!lines.length) return { rows: [], truncated: false }
  const head = parseCsvLine(lines[0]).map(s => s.trim().toLowerCase())
  const vi = head.findIndex(h => ['url', 'text', 'value', 'content', 'link'].includes(h))
  const ni = head.findIndex(h => ['name', 'filename', 'label', 'id'].includes(h))
  const rows: BulkRow[] = (vi >= 0 ? lines.slice(1).map(parseCsvLine) : lines.map(l => [l]))
    .map((c, i) => ({ value: (vi >= 0 ? c[vi] : c[0])?.trim() ?? '', name: (ni >= 0 ? c[ni]?.trim() : '') || String(i + 1).padStart(3, '0') }))
    .filter(r => r.value)
  return { rows: rows.slice(0, MAX_BULK), truncated: rows.length > MAX_BULK }
}

export async function renderBulkZip(rows: BulkRow[], d: QrDesign, size: number, onProgress: (done: number) => void): Promise<{ blob: Blob; failed: number }> {
  const zip = new JSZip(), used = new Set<string>()
  let failed = 0
  for (let i = 0; i < rows.length; i++) {
    try {
      let base = rows[i].name.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || String(i + 1)
      for (let n = 2; used.has(base.toLowerCase()); n++) base = `${base.replace(/_\d+$/, '')}_${n}`
      used.add(base.toLowerCase())
      zip.file(`${base}.png`, await renderPng(rows[i].value, d, size))
    } catch { failed++ }
    onProgress(i + 1)
    if (i % 5 === 4) await new Promise(r => setTimeout(r, 0))
  }
  return { blob: await zip.generateAsync({ type: 'blob' }), failed }
}
