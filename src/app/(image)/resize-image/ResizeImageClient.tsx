'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { resizeImage } from '@/lib/tools/image/resize'
import { SizeControls } from '@/lib/tools/image/SizeControls'
import JSZip from 'jszip'
import { compressToTargetSize } from '@/lib/tools/image/targetSize'
import { setBlobDpi, toPx, convertUnit, fmtUnit, type Unit } from '@/lib/tools/image/dpi'
import type { IdPreset } from '@/lib/tools/image/passportPresets'

const PRESETS = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1280×720', w: 1280, h: 720 },
  { label: '800×600', w: 800, h: 600 },
  { label: '512×512', w: 512, h: 512 },
]

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

export function ResizeImageClient() {
  const [files, setFiles] = useState<File[]>([])
  const [maxKb, setMaxKb] = useState('')
  const [progress, setProgress] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [zipName, setZipName] = useState('')
  const [ar, setAr] = useState<number | null>(null)
  const [unit, setUnit] = useState<Unit>('px')
  const [dpi, setDpi] = useState('300')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lockAspect, setLockAspect] = useState(true)
  const [cover, setCover] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dpiNum = Math.min(1200, Math.max(1, Number(dpi) || 300))
  const num = (v: string) => { const n = Number(v); return n > 0 ? n : undefined }
  const batch = files.length > 1
  const touch = () => { setResult(null); setError(null); setNotes([]); setCover(false) }

  const onFile = (f: File[]) => {
    const next = f[0] || null
    setFiles(f); setResult(null); setNotes([]); setError(null); setAr(null)
    if (!next || f.length > 1) return
    const url = URL.createObjectURL(next)
    const img = new Image()
    img.onload = () => { setAr(img.naturalWidth / img.naturalHeight); URL.revokeObjectURL(url) }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }

  const editW = (v: string) => {
    touch(); setWidth(v)
    const n = num(v)
    if (lockAspect && ar && n) setHeight(fmtUnit(n / ar, unit))
    else if (lockAspect && !v) setHeight('')
  }
  const editH = (v: string) => {
    touch(); setHeight(v)
    const n = num(v)
    if (lockAspect && ar && n) setWidth(fmtUnit(n * ar, unit))
    else if (lockAspect && !v) setWidth('')
  }
  const changeUnit = (u: Unit) => {
    touch()
    const conv = (v: string) => (num(v) ? fmtUnit(convertUnit(Number(v), unit, u, dpiNum), u) : v)
    setWidth(conv(width)); setHeight(conv(height)); setUnit(u)
  }
  const applyPreset = (w: number, h: number) => {
    touch(); setUnit('px'); setWidth(String(w)); setHeight(String(h))
  }
  const applyId = (p: IdPreset) => {
    setResult(null); setNotes([]); setError(null); setUnit(p.unit); setDpi('300'); setWidth(String(p.w)); setHeight(String(p.h)); setCover(true)
  }

  // pixel size that will actually be produced
  const wIn = num(width), hIn = num(height)
  let pw = wIn ? Math.max(1, toPx(wIn, unit, dpiNum)) : undefined
  let ph = hIn ? Math.max(1, toPx(hIn, unit, dpiNum)) : undefined
  if (batch && lockAspect && !cover) ph = undefined // each image keeps its own ratio; width wins
  if (!batch && lockAspect && ar) {
    if (pw && !ph) ph = Math.max(1, Math.round(pw / ar))
    else if (ph && !pw) pw = Math.max(1, Math.round(ph * ar))
  }
  if (batch && lockAspect && !cover && !pw && hIn) ph = Math.max(1, toPx(hIn, unit, dpiNum))
  const perImage = batch && lockAspect && !cover
  const sizeOk = (perImage ? !!(pw || ph) : !!pw && !!ph) && (pw ?? 0) <= 16000 && (ph ?? 0) <= 16000
  const kbNum = maxKb.trim() === '' ? 0 : Number(maxKb)
  const kbOk = maxKb.trim() === '' || kbNum >= 1

  const handleResize = async () => {
    if (files.length === 0) { setError('Please select an image first.'); return }
    if (!perImage && (!pw || !ph)) { setError('Enter both width and height, or turn on the aspect ratio lock and enter one.'); return }
    if (perImage && !pw && !ph) { setError('Enter a width or a height. Each image keeps its own ratio.'); return }
    if (!sizeOk) { setError('That size is too large. Keep each side under 16,000 pixels.'); return }
    if (!kbOk) { setError('Max file size must be at least 1 KB, or leave it empty.'); return }
    setProcessing(true); setError(null); setNotes([]); setResult(null)
    const out: { name: string; blob: Blob }[] = []
    const msgs: string[] = []
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(batch ? `${i + 1} of ${files.length}` : '')
        const file = files[i]
        let blob = await resizeImage(file, perImage
          ? { width: pw, height: pw ? undefined : ph, keepAspectRatio: true }
          : { width: pw, height: ph, keepAspectRatio: false, cover })
        if (kbNum && blob.size > kbNum * 1000) {
          // leave room for the 18-byte JFIF header added for DPI
          const r = await compressToTargetSize(new File([blob], file.name, { type: blob.type }), kbNum * 1000 - 40, blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg')
          blob = r.blob
          const label = batch ? `${file.name}: ` : ''
          const kb = (blob.size / 1000).toFixed(1)
          if (!r.reached) msgs.push(`${label}${kbNum} KB is not possible for this image, even at lowest quality and a smaller size. Smallest result: ${kb} KB at ${r.width} × ${r.height} px.`)
          else if (r.downscaled) msgs.push(`${label}${kbNum} KB was not possible at the chosen size, so it was reduced to ${r.width} × ${r.height} px (${kb} KB).`)
          else if (file.type === 'image/png') msgs.push(`${label}PNG was saved as JPG to reach ${kbNum} KB (${kb} KB).`)
        }
        if (unit !== 'px') blob = await setBlobDpi(blob, dpiNum) // JPEG/PNG only; WebP is left as is
        out.push({ name: file.name, blob })
      }
      setNotes(msgs)
      if (out.length === 1) { setZipName(''); setResult(out[0].blob) }
      else {
        const zip = new JSZip()
        out.forEach((o, i) => {
          const e = o.blob.type === 'image/png' ? 'png' : o.blob.type === 'image/webp' ? 'webp' : 'jpg'
          zip.file(`${o.name.replace(/\.[^.]+$/, '')}_resized_${i + 1}.${e}`, o.blob)
        })
        setZipName('resized-images.zip')
        setResult(await zip.generateAsync({ type: 'blob' }))
      }
    } catch {
      setError('Resize failed. Please try again.')
    } finally {
      setProcessing(false); setProgress('')
    }
  }

  const ext = zipName ? 'zip' : result?.type === 'image/png' ? 'png' : result?.type === 'image/webp' ? 'webp' : 'jpg'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={onFile} multiple maxFiles={20}
        label="Drag & drop your image here"
        sublabel="Up to 20 images at once, the same size for all. JPG, PNG, WebP"
      />
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Preset Sizes</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.w, p.h)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-brand-400 hover:text-brand-600 transition-all cursor-pointer">
              {p.label}
            </button>
          ))}
        </div>
        <SizeControls unit={unit} dpi={dpi} onUnit={changeUnit} onDpi={d => { touch(); setDpi(d) }} onPreset={applyId} />
        <div className="flex gap-3 items-end mt-4">
          <div className="flex-1 min-w-0">
            <label htmlFor="rs-w" className="block text-xs text-gray-600 mb-1">Width ({unit})</label>
            <input id="rs-w" type="number" min="0" step="any" value={width} onChange={e => editW(e.target.value)} placeholder="e.g. 35" className={inputCls} />
          </div>
          <button onClick={() => { setLockAspect(!lockAspect); setResult(null) }} title="Toggle aspect ratio lock" aria-pressed={lockAspect} aria-label="Aspect ratio lock"
            className={`mb-0.5 p-2 rounded-lg border transition-all cursor-pointer ${lockAspect ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-400'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {lockAspect
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              }
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <label htmlFor="rs-h" className="block text-xs text-gray-600 mb-1">Height ({unit})</label>
            <input id="rs-h" type="number" min="0" step="any" value={height} onChange={e => editH(e.target.value)} placeholder="e.g. 45" className={inputCls} />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-700" aria-live="polite">
          {perImage && (pw || ph) ? <>Output: <strong>{pw ? `${pw} px wide` : `${ph} px high`}</strong>, height follows each image{unit !== 'px' && ` at ${dpiNum} DPI`}</> : pw && ph ? <>Output: <strong>{pw} × {ph} px</strong>{unit !== 'px' && ` at ${dpiNum} DPI`}</> : 'Output size appears here.'}
        </p>
        {cover && <p className="mt-1 text-xs text-gray-500">The photo fills this size and is centred; edges that do not fit are cut off. Use Crop Image to choose the area yourself.</p>}
        {unit !== 'px' && <p className="mt-1 text-xs text-gray-500">DPI is saved in JPG and PNG files so print size is correct. WebP files do not carry it.</p>}
      </div>
      <div className="mt-4">
        <label htmlFor="rs-kb" className="block text-xs text-gray-600 mb-1">Max file size (KB), optional</label>
        <input id="rs-kb" type="number" min="1" step="any" value={maxKb} onChange={e => { setMaxKb(e.target.value); touch() }} placeholder="e.g. 50" className={`${inputCls} max-w-40`} />
        <p className="mt-1 text-xs text-gray-500">The size stays fixed and quality is lowered to fit (1 KB = 1000 bytes). PNG is saved as JPG to reach a size. For a size-only job use <Link href="/compress-image" className="text-brand-600 underline">Compress Image</Link>.</p>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleResize} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? `Resizing${progress ? ' ' + progress : ''}…` : batch ? `Resize ${files.length} Images` : 'Resize Image'}
      </Button>
      {result && notes.length > 0 && (
        <ul className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 space-y-1">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
      )}
      {result && <ToolResult blob={result} filename={zipName || `resized.${ext}`} label={zipName ? `${files.length} images resized!` : 'Image resized successfully!'} />}
    </div>
  )
}
