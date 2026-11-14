'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { resizeImage } from '@/lib/tools/image/resize'
import { SizeControls } from '@/lib/tools/image/SizeControls'
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
  const [file, setFile] = useState<File | null>(null)
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
  const touch = () => { setResult(null); setError(null); setCover(false) }

  const onFile = (f: File[]) => {
    const next = f[0] || null
    setFile(next); setResult(null); setAr(null)
    if (!next) return
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
    setResult(null); setError(null); setUnit(p.unit); setDpi('300'); setWidth(String(p.w)); setHeight(String(p.h)); setCover(true)
  }

  // pixel size that will actually be produced
  const wIn = num(width), hIn = num(height)
  let pw = wIn ? Math.max(1, toPx(wIn, unit, dpiNum)) : undefined
  let ph = hIn ? Math.max(1, toPx(hIn, unit, dpiNum)) : undefined
  if (lockAspect && ar) {
    if (pw && !ph) ph = Math.max(1, Math.round(pw / ar))
    else if (ph && !pw) pw = Math.max(1, Math.round(ph * ar))
  }
  const sizeOk = !!pw && !!ph && pw <= 16000 && ph <= 16000

  const handleResize = async () => {
    if (!file) { setError('Please select an image first.'); return }
    if (!pw || !ph) { setError('Enter both width and height, or turn on the aspect ratio lock and enter one.'); return }
    if (!sizeOk) { setError('That size is too large. Keep each side under 16,000 pixels.'); return }
    setProcessing(true); setError(null)
    try {
      let blob = await resizeImage(file, { width: pw, height: ph, keepAspectRatio: false, cover })
      if (unit !== 'px') blob = await setBlobDpi(blob, dpiNum) // JPEG/PNG only; WebP is left as is
      setResult(blob)
    } catch {
      setError('Resize failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const ext = result?.type === 'image/png' ? 'png' : result?.type === 'image/webp' ? 'webp' : 'jpg'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={onFile}
        label="Drag & drop your image here"
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
          {pw && ph ? <>Output: <strong>{pw} × {ph} px</strong>{unit !== 'px' && ` at ${dpiNum} DPI`}</> : 'Output size appears here.'}
        </p>
        {cover && <p className="mt-1 text-xs text-gray-500">The photo fills this size and is centred; edges that do not fit are cut off. Use Crop Image to choose the area yourself.</p>}
        {unit !== 'px' && <p className="mt-1 text-xs text-gray-500">DPI is saved in JPG and PNG files so print size is correct. WebP files do not carry it.</p>}
      </div>
      <p className="mt-4 text-xs text-gray-500">Need a file under a certain size, e.g. 100 KB? Use <Link href="/compress-image" className="text-brand-600 underline">Compress Image → Target size</Link>.</p>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleResize} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Resizing…' : 'Resize Image'}
      </Button>
      {result && <ToolResult blob={result} filename={`resized.${ext}`} label="Image resized successfully!" />}
    </div>
  )
}
