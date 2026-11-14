import { PDFDocument } from 'pdf-lib'
import { loadSegmenter, NoPersonError } from './backgroundBlur'
import { detectFaces } from './faceDetect'
import { setBlobDpi, toPx, type Unit } from './dpi'
import type { NormRect } from './regionBlur'

export const DPI = 300
export const MAX_SRC = 2400

// Typical chin-to-crown height as a fraction of photo height, per preset (approximate guidance, rules change).
export const HEAD_FRACTION: Record<string, [number, number]> = {
  'US 2×2 in': [0.5, 0.69],
  'UK / EU / India / Pakistan 35×45 mm': [0.71, 0.8],
  'Schengen visa 35×45 mm': [0.71, 0.8],
  'Canada 50×70 mm': [0.44, 0.51],
  'China 33×48 mm': [0.58, 0.69],
}
export const headRange = (label: string): [number, number] => HEAD_FRACTION[label] ?? [0.6, 0.75]

export interface Crop { cx: number; cy: number; ch: number }

const canvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }

/** Decode (EXIF-aware) and cap the longest side so segmentation + preview stay fast. */
export async function loadSource(file: File): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, MAX_SRC / Math.max(bmp.width, bmp.height))
  const c = canvas(Math.round(bmp.width * k), Math.round(bmp.height * k))
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  return c
}

/** Largest face -> crop that centres the head and gives it the preset's typical head-height fraction. */
export async function autoCrop(file: File, src: HTMLCanvasElement, presetLabel: string): Promise<{ crop: Crop; found: boolean }> {
  let face: NormRect | undefined
  try { face = (await detectFaces(file)).sort((a, b) => b.w * b.h - a.w * a.h)[0] } catch { /* fall back to centre */ }
  const [lo, hi] = headRange(presetLabel)
  if (!face) return { crop: { cx: src.width / 2, cy: src.height / 2, ch: src.height }, found: false }
  const ch = (face.h * src.height) / ((lo + hi) / 2)
  return { crop: { cx: (face.x + face.w / 2) * src.width, cy: (face.y + face.h / 2) * src.height + 0.04 * ch, ch }, found: true }
}

const smoothstep = (x: number) => { const t = Math.min(1, Math.max(0, (x - 0.45) / 0.35)); return t * t * (3 - 2 * t) }

/** Person cut-out (transparent background, feathered edge) at the source resolution. Throws NoPersonError. */
export async function buildCutout(src: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const seg = await loadSegmenter()
  const result = seg.segment(src)
  try {
    const mask = result.confidenceMasks?.[result.confidenceMasks.length - 1]
    if (!mask) throw new Error('No mask')
    const data = mask.getAsFloat32Array()
    const small = canvas(mask.width, mask.height)
    const sctx = small.getContext('2d')!
    const px = sctx.createImageData(mask.width, mask.height)
    let sure = 0
    for (let i = 0; i < data.length; i++) { if (data[i] > 0.9) sure++; px.data[i * 4 + 3] = Math.round(smoothstep(data[i]) * 255) }
    if (sure / data.length < 0.08) throw new NoPersonError('No person detected')
    sctx.putImageData(px, 0, 0)
    const m = canvas(src.width, src.height)
    const mctx = m.getContext('2d')!
    mctx.imageSmoothingQuality = 'high'
    mctx.filter = `blur(${Math.max(1, Math.round(Math.max(src.width, src.height) / 600))}px)`
    mctx.drawImage(small, 0, 0, src.width, src.height)
    const out = canvas(src.width, src.height)
    const octx = out.getContext('2d')!
    octx.drawImage(src, 0, 0)
    octx.globalCompositeOperation = 'destination-in'
    octx.drawImage(m, 0, 0)
    return out
  } finally { result.close() }
}

/** Draw the crop at w x h. bg null = keep original background. Areas outside the photo are filled with bg (white if none). */
export function renderPhoto(src: HTMLCanvasElement, cutout: HTMLCanvasElement | null, bg: string | null, crop: Crop, w: number, h: number): HTMLCanvasElement {
  const c = canvas(w, h)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = bg ?? '#ffffff'
  ctx.fillRect(0, 0, w, h)
  const cw = (crop.ch * w) / h
  ctx.imageSmoothingQuality = 'high'
  const from = bg && cutout ? cutout : src
  const sx = crop.cx - cw / 2, sy = crop.cy - crop.ch / 2
  // clip the source rect to the image by hand (out-of-range source rects are inconsistent across browsers)
  const x0 = Math.max(0, sx), y0 = Math.max(0, sy), x1 = Math.min(from.width, sx + cw), y1 = Math.min(from.height, sy + crop.ch)
  if (x1 > x0 && y1 > y0) ctx.drawImage(from, x0, y0, x1 - x0, y1 - y0, ((x0 - sx) / cw) * w, ((y0 - sy) / crop.ch) * h, ((x1 - x0) / cw) * w, ((y1 - y0) / crop.ch) * h)
  return c
}

export const toJpeg = (c: HTMLCanvasElement, q = 0.95) =>
  new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Export failed'))), 'image/jpeg', q))

export const photoPx = (w: number, h: number, unit: Unit) => ({ w: toPx(w, unit, DPI), h: toPx(h, unit, DPI) })

export interface SheetSize { id: string; label: string; w: number; h: number } // inches
export const SHEETS: SheetSize[] = [
  { id: '4x6', label: '4×6 in', w: 4, h: 6 },
  { id: 'a4', label: 'A4', w: 210 / 25.4, h: 297 / 25.4 },
]
const MARGIN = 20, GAP = 30

function grid(W: number, H: number, pw: number, ph: number) {
  const cols = Math.max(0, Math.floor((W - 2 * MARGIN + GAP) / (pw + GAP)))
  const rows = Math.max(0, Math.floor((H - 2 * MARGIN + GAP) / (ph + GAP)))
  return { cols, rows, n: cols * rows }
}

/** Sheet at 300 DPI with as many copies as fit (tries both orientations), thin cut guides. */
export async function makeSheet(photo: HTMLCanvasElement, sheet: SheetSize): Promise<{ jpg: Blob; pdf: Blob; copies: number; width: number; height: number }> {
  const sw = Math.round(sheet.w * DPI), sh = Math.round(sheet.h * DPI)
  const land = grid(sh, sw, photo.width, photo.height), port = grid(sw, sh, photo.width, photo.height)
  const [W, H, g] = land.n > port.n ? [sh, sw, land] : [sw, sh, port]
  if (g.n === 0) throw new Error('Photo does not fit on this sheet')
  const c = canvas(W, H)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
  const gw = g.cols * photo.width + (g.cols - 1) * GAP, gh = g.rows * photo.height + (g.rows - 1) * GAP
  const ox = Math.round((W - gw) / 2), oy = Math.round((H - gh) / 2)
  ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1
  for (let r = 0; r < g.rows; r++) for (let k = 0; k < g.cols; k++) {
    const x = ox + k * (photo.width + GAP), y = oy + r * (photo.height + GAP)
    ctx.drawImage(photo, x, y)
    ctx.strokeRect(x - 0.5, y - 0.5, photo.width + 1, photo.height + 1)
  }
  const jpg = await setBlobDpi(await toJpeg(c, 0.95), DPI)
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([(W / DPI) * 72, (H / DPI) * 72])
  page.drawImage(await pdf.embedJpg(await jpg.arrayBuffer()), { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
  return { jpg, pdf: new Blob([(await pdf.save()) as BlobPart], { type: 'application/pdf' }), copies: g.n, width: W, height: H }
}
