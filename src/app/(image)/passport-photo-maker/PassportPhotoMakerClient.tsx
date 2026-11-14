'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { ID_PRESETS } from '@/lib/tools/image/passportPresets'
import { NoPersonError, closeSegmenter } from '@/lib/tools/image/backgroundBlur'
import { closeFaceDetector } from '@/lib/tools/image/faceDetect'
import { compressToTargetSize } from '@/lib/tools/image/targetSize'
import { setBlobDpi } from '@/lib/tools/image/dpi'
import { SHEETS, autoCrop, buildCutout, headRange, loadSource, makeSheet, photoPx, renderPhoto, toJpeg, type Crop } from '@/lib/tools/image/passportPhoto'

const BGS = [
  { id: 'orig', label: 'Keep original', color: null },
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'off', label: 'Off-white', color: '#f4f1ea' },
  { id: 'blue', label: 'Light blue', color: '#b9d6ee' },
  { id: 'grey', label: 'Light grey', color: '#e5e7eb' },
  { id: 'custom', label: 'Custom', color: '#ffffff' },
]
const LIMITS = [{ label: 'No limit', kb: 0 }, { label: '≤ 50 KB', kb: 50 }, { label: '≤ 100 KB', kb: 100 }, { label: '≤ 240 KB', kb: 240 }, { label: '≤ 500 KB', kb: 500 }]
const PREVIEW_H = 420

type Out = { blob: Blob; name: string; label: string }

export function PassportPhotoMakerClient() {
  const [file, setFile] = useState<File | null>(null)
  const [src, setSrc] = useState<HTMLCanvasElement | null>(null)
  const [cutout, setCutout] = useState<HTMLCanvasElement | null>(null)
  const [preset, setPreset] = useState(1)
  const [bgId, setBgId] = useState('white')
  const [custom, setCustom] = useState('#ffffff')
  const [auto, setAuto] = useState<Crop | null>(null)
  const [pos, setPos] = useState<{ cx: number; cy: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [limit, setLimit] = useState(0)
  const [sheetId, setSheetId] = useState('4x6')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [photo, setPhoto] = useState<Out | null>(null)
  const [sheet, setSheet] = useState<{ jpg: Out; pdf: Blob; copies: number } | null>(null)
  const prev = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  const p = ID_PRESETS[preset]
  const px = photoPx(p.w, p.h, p.unit)
  const bg = BGS.find(b => b.id === bgId)!
  const color = bgId === 'custom' ? custom : bg.color
  const crop: Crop | null = auto && pos ? { cx: pos.cx, cy: pos.cy, ch: auto.ch / zoom } : null
  const [lo, hi] = headRange(p.label)

  const clear = () => { setPhoto(null); setSheet(null); setError(null) }
  useEffect(() => () => { closeSegmenter(); closeFaceDetector() }, [])

  const place = useCallback(async (f: File, s: HTMLCanvasElement, label: string) => {
    const r = await autoCrop(f, s, label)
    setAuto(r.crop); setPos({ cx: r.crop.cx, cy: r.crop.cy }); setZoom(1)
    setNote(r.found ? null : 'No face found automatically. Position the photo by hand using zoom and drag.')
  }, [])

  const presetRef = useRef(preset)
  presetRef.current = preset

  const onFiles = useCallback(async (fs: File[]) => {
    clear(); setCutout(null); setSrc(null); setAuto(null); setPos(null); setNote(null)
    const f = fs[0] ?? null
    setFile(f)
    if (!f) return
    setBusy('Finding your face on your device…')
    try {
      const s = await loadSource(f)
      setSrc(s)
      await place(f, s, ID_PRESETS[presetRef.current].label)
    } catch { setError('Could not read this image. Try a JPG or PNG.') } finally { setBusy(null) }
  }, [place])

  // background replacement needs the person cut-out: build it once, lazily
  useEffect(() => {
    if (!src || !bg.color || cutout) return
    let live = true
    setBusy('Replacing background on your device…')
    buildCutout(src).then(c => { if (live) setCutout(c) }).catch(e => {
      if (!live) return
      setError(e instanceof NoPersonError ? 'No person detected, so the background cannot be replaced. Use a clear front-facing portrait, or choose "Keep original".' : 'Background replacement failed. You can still keep the original background.')
      setBgId('orig')
    }).finally(() => { if (live) setBusy(null) })
    return () => { live = false }
  }, [src, bg.color, cutout])

  // live preview
  useEffect(() => {
    const c = prev.current
    if (!c || !src || !crop) return
    const h = Math.min(PREVIEW_H, px.h), w = Math.round((h * px.w) / px.h)
    const r = renderPhoto(src, cutout, color, crop, w, h)
    c.width = w; c.height = h
    c.getContext('2d')!.drawImage(r, 0, 0)
  }, [src, cutout, color, crop?.cx, crop?.cy, crop?.ch, px.w, px.h]) // eslint-disable-line react-hooks/exhaustive-deps

  const onDown = (e: React.PointerEvent) => { if (e.isPrimary) { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY } } }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || !crop || !prev.current) return
    const k = crop.ch / prev.current.getBoundingClientRect().height
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    setPos(o => o && { cx: o.cx - dx * k, cy: o.cy - dy * k })
    drag.current = { x: e.clientX, y: e.clientY }; clear()
  }
  const onUp = () => { drag.current = null }

  const changePreset = (i: number) => {
    setPreset(i); clear()
    if (file && src) place(file, src, ID_PRESETS[i].label).catch(() => {})
  }

  const make = async (kind: 'photo' | 'sheet') => {
    if (!src || !crop) return
    setBusy(kind === 'photo' ? 'Creating photo…' : 'Creating sheet…'); clear()
    try {
      const c = renderPhoto(src, cutout, color, crop, px.w, px.h)
      const jpg = await toJpeg(c)
      if (kind === 'photo') {
        let blob = jpg, msg: string | null = null
        if (limit) {
          const r = await compressToTargetSize(new File([jpg], 'p.jpg', { type: 'image/jpeg' }), limit * 1000 - 40, 'image/jpeg')
          blob = r.blob
          if (!r.reached) msg = `Could not get under ${limit} KB.`
          else if (r.downscaled) msg = `To fit ${limit} KB the photo was reduced to ${r.width}×${r.height} px, smaller than the standard size.`
        }
        const out = await setBlobDpi(blob, 300)
        setPhoto({ blob: out, name: 'passport-photo.jpg', label: `Photo ready: ${p.label}, 300 DPI` })
        setNote(msg)
      } else {
        const sh = SHEETS.find(x => x.id === sheetId)!
        const s = await makeSheet(c, sh)
        setSheet({ jpg: { blob: s.jpg, name: `passport-photos-${sheetId}.jpg`, label: `${s.copies} photos on a ${sh.label} sheet (${s.width}×${s.height} px)` }, pdf: s.pdf, copies: s.copies })
      }
    } catch { setError('Something went wrong creating the file. Please try again.') } finally { setBusy(null) }
  }

  const lbl = 'block text-sm font-medium text-gray-700 mb-2'
  const chip = (on: boolean) => `rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition-colors ${on ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600 font-semibold text-gray-900' : 'border-gray-200 text-gray-700 hover:border-brand-400 hover:bg-gray-50'}`

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={onFiles}
        label="Drag & drop a portrait here"
        sublabel="JPG, PNG or WebP, front-facing, max 50MB. Processed on your device, nothing is uploaded."
      />

      <div>
        <span className={lbl}>Country / document size</span>
        <div role="radiogroup" aria-label="Photo size" className="flex flex-wrap gap-2">
          {ID_PRESETS.map((x, i) => (
            <button key={x.label} type="button" role="radio" aria-checked={preset === i} onClick={() => changePreset(i)} className={chip(preset === i)}>{x.label}</button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-600">Output: {px.w}×{px.h} px at 300 DPI. Head height guide for this size: about {Math.round(lo * 100)}–{Math.round(hi * 100)}% of the photo height.</p>
      </div>

      <div>
        <span className={lbl}>Background</span>
        <div role="radiogroup" aria-label="Background" className="flex flex-wrap items-center gap-2">
          {BGS.map(b => (
            <button key={b.id} type="button" role="radio" aria-checked={bgId === b.id} onClick={() => { setBgId(b.id); clear() }} className={`${chip(bgId === b.id)} inline-flex items-center gap-2`}>
              {b.color && <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ background: b.id === 'custom' ? custom : b.color }} />}
              {b.label}
            </button>
          ))}
          {bgId === 'custom' && <input type="color" aria-label="Custom background colour" value={custom} onChange={e => { setCustom(e.target.value); clear() }} className="h-9 w-12 cursor-pointer rounded border border-gray-300" />}
        </div>
        <p className="mt-2 text-xs text-gray-600">Background replacement runs on your device. The first use loads a small model (about 0.3 MB) from this site.</p>
      </div>

      {busy && <p role="status" className="text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-4 py-2">{busy}</p>}
      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      {note && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">{note}</p>}

      {src && crop && (
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] items-start">
          <div className="mx-auto">
            <canvas ref={prev} aria-label="Photo preview. Drag to reposition."
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              className="block max-w-full h-auto touch-none select-none cursor-grab border border-gray-300 shadow-sm bg-white" style={{ maxHeight: PREVIEW_H }} />
            <p className="mt-1 text-xs text-gray-500 text-center">Drag to move</p>
          </div>
          <div className="space-y-4 min-w-0">
            <label className="block text-sm font-medium text-gray-700">Zoom: {zoom.toFixed(2)}×
              <input type="range" min={0.5} max={3} step={0.01} value={zoom} onChange={e => { setZoom(+e.target.value); clear() }} className="mt-2 w-full cursor-pointer accent-brand-600" />
            </label>
            <div>
              <span className={lbl}>Max file size (single photo)</span>
              <div className="flex flex-wrap gap-2">{LIMITS.map(l => <button key={l.kb} type="button" onClick={() => { setLimit(l.kb); clear() }} aria-pressed={limit === l.kb} className={chip(limit === l.kb)}>{l.label}</button>)}</div>
            </div>
            <Button onClick={() => make('photo')} disabled={!!busy} size="lg" className="w-full cursor-pointer">Create photo ({px.w}×{px.h} px)</Button>
            <div>
              <span className={lbl}>Print sheet</span>
              <div className="flex flex-wrap gap-2 mb-2">{SHEETS.map(s => <button key={s.id} type="button" onClick={() => { setSheetId(s.id); setSheet(null) }} aria-pressed={sheetId === s.id} className={chip(sheetId === s.id)}>{s.label}</button>)}</div>
              <Button onClick={() => make('sheet')} disabled={!!busy} variant="outline" size="lg" className="w-full cursor-pointer">Create print sheet</Button>
            </div>
          </div>
        </div>
      )}

      {photo && <ToolResult blob={photo.blob} filename={photo.name} label={photo.label} />}
      {sheet && (
        <>
          <ToolResult blob={sheet.jpg.blob} filename={sheet.jpg.name} label={sheet.jpg.label} />
          <Button onClick={() => saveAs(sheet.pdf, sheet.jpg.name.replace('.jpg', '.pdf'))} variant="outline" size="lg" className="w-full cursor-pointer">Download PDF ({(sheet.pdf.size / 1024).toFixed(0)} KB)</Button>
        </>
      )}

      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
        <p className="font-semibold text-gray-900 mb-1">Before you submit</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>Neutral expression, mouth closed, eyes open and looking at the camera.</li>
          <li>Even lighting with no shadows on the face or background; no glasses where your country forbids them.</li>
          <li>Face position here is approximate guidance. Check your country&apos;s official rules; we cannot guarantee acceptance.</li>
        </ul>
      </div>
    </div>
  )
}
