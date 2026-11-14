'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { blurImage } from '@/lib/tools/image/blur'
import { blurBackground, closeSegmenter, isSegmenterLoaded, NoPersonError } from '@/lib/tools/image/backgroundBlur'
import { closeFaceDetector, detectFaces, isFaceDetectorLoaded } from '@/lib/tools/image/faceDetect'
import { effectRegions, type NormRect, type RegionEffect } from '@/lib/tools/image/regionBlur'

type Mode = 'whole' | 'background' | 'areas'

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'whole', label: 'Whole image', hint: 'Blur the entire picture' },
  { id: 'background', label: 'Background only', hint: 'Keep people sharp, blur the rest' },
  { id: 'areas', label: 'Selected areas', hint: 'Draw boxes over faces, plates or text' },
]

function useObjectUrl(blob: Blob | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) { setUrl(null); return }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

type Pt = { x: number; y: number }
const box = (a: Pt, b: Pt): NormRect =>
  ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) })

export function BlurImageClient() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<Mode>('whole')
  const [radius, setRadius] = useState(10)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [loadingModel, setLoadingModel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rects, setRects] = useState<NormRect[]>([])
  const [draft, setDraft] = useState<NormRect | null>(null)
  const [effect, setEffect] = useState<RegionEffect>('blur')
  const start = useRef<Pt | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const original = useObjectUrl(files[0] ?? null)
  const blurred = useObjectUrl(result)

  const [detecting, setDetecting] = useState(false)
  const [faceMsg, setFaceMsg] = useState<string | null>(null)
  const [loadingFaces, setLoadingFaces] = useState(false)

  useEffect(() => () => { closeSegmenter(); closeFaceDetector() }, [])

  const reset = () => { setResult(null); setError(null) }
  const onFiles = useCallback((f: File[]) => { setFiles(f); setFaceMsg(null); setRects([]); setDraft(null); setResult(null); setError(null) }, [])
  const changeRects = (f: (p: NormRect[]) => NormRect[]) => { setRects(f); reset() }

  // pointer events cover mouse, touch and pen; touch-none on the wrapper stops page scroll while drawing
  const pt = (e: React.PointerEvent): Pt => {
    const b = imgRef.current!.getBoundingClientRect()
    return { x: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) }
  }
  const onDown = (e: React.PointerEvent) => {
    if (!e.isPrimary || e.button > 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = pt(e)
  }
  const onMove = (e: React.PointerEvent) => { if (start.current) setDraft(box(start.current, pt(e))) }
  const onUp = (e: React.PointerEvent) => {
    const s = start.current; start.current = null; setDraft(null)
    if (!s) return
    const r = box(s, pt(e))
    if (r.w > 0.01 && r.h > 0.01) changeRects(p => [...p, r])
  }
  const onCancel = () => { start.current = null; setDraft(null) }

  const findFaces = async () => {
    setDetecting(true); setError(null); setFaceMsg(null); setLoadingFaces(!isFaceDetectorLoaded())
    try {
      const faces = await detectFaces(files[0])
      if (faces.length === 0) setFaceMsg('No faces found. Draw boxes manually.')
      else { changeRects(p => [...p, ...faces]); setFaceMsg(`Found ${faces.length} ${faces.length === 1 ? 'face' : 'faces'}. Review the boxes, remove or add any, then apply.`) }
    } catch {
      setError('Face detection failed. You can still draw boxes manually.')
    } finally {
      setDetecting(false); setLoadingFaces(false)
    }
  }

  const handle = async () => {
    if (files.length === 0) { setError('Please select an image.'); return }
    if (mode === 'areas' && rects.length === 0) { setError('Drag on the image to select at least one area.'); return }
    setProcessing(true); setError(null); setResult(null)
    try {
      if (mode === 'background') {
        setLoadingModel(!isSegmenterLoaded())
        setResult(await blurBackground(files[0], radius))
      } else if (mode === 'areas') {
        setResult(await effectRegions(files[0], rects, effect, radius))
      } else {
        setResult(await blurImage(files[0], radius))
      }
    } catch (e) {
      setError(e instanceof NoPersonError
        ? 'No person detected. Background mode works best on portraits and photos of people. Try "Whole image" instead.'
        : 'An error occurred. Please check your image and try again.')
    } finally {
      setProcessing(false); setLoadingModel(false)
    }
  }

  const ext = result?.type === 'image/png' ? 'png' : result?.type === 'image/webp' ? 'webp' : 'jpg'
  const areas = mode === 'areas'
  const sliderLabel = areas ? (effect === 'pixelate' ? `Block Size: ${radius}` : `Blur Intensity: ${radius}`) : `Blur Intensity: ${radius}px`

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={onFiles}
        label="Drag & drop your image here"
        sublabel="Supports JPG, PNG, WebP, max 50MB"
      />
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">What to blur</span>
        <div role="radiogroup" aria-label="What to blur" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {MODES.map(m => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id}
              onClick={() => { setMode(m.id); reset() }}
              className={`text-left rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                mode === m.id ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-gray-200 hover:border-brand-400 hover:bg-gray-50'
              }`}>
              <span className="block text-sm font-semibold text-gray-900">{m.label}</span>
              <span className="block text-xs text-gray-600">{m.hint}</span>
            </button>
          ))}
        </div>
        {mode === 'background' && (
          <p className="mt-2 text-xs text-gray-600">Runs in your browser. The first run loads a small (0.3 MB) detection model from this site. Works on people, not other objects.</p>
        )}
      </div>
      {areas && !original && (
        <p className="text-xs text-gray-600">Upload an image, then drag boxes over the parts you want to blur or pixelate.</p>
      )}
      {areas && original && (
        <div className="space-y-3">
          <p className="text-xs text-gray-600">Click Detect faces to box faces automatically, or drag on the image to draw a box around each area to hide. Detection runs in your browser and can miss small, distant or turned-away faces, so check the boxes.</p>
          <div className="relative mx-auto w-fit max-w-full touch-none select-none cursor-crosshair"
            onMouseDown={e => e.preventDefault()} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={imgRef} src={original} alt="Image to edit. Drag to select areas." draggable={false}
              className="block max-w-full max-h-[28rem] w-auto h-auto rounded-lg border border-gray-200" />
            {[...rects, ...(draft ? [draft] : [])].map((r, i) => (
              <div key={i} data-testid={i < rects.length ? 'region' : 'draft'}
                style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
                className="absolute border-2 border-brand-600 bg-brand-600/20 pointer-events-none">
                {i < rects.length && (
                  <button type="button" aria-label={`Remove area ${i + 1}`}
                    onPointerDown={e => e.stopPropagation()}
                    onClick={() => changeRects(p => p.filter((_, j) => j !== i))}
                    className="pointer-events-auto absolute -top-3 -right-3 w-6 h-6 rounded-full bg-white border border-gray-300 text-gray-700 text-sm leading-none flex items-center justify-center cursor-pointer hover:bg-red-50">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={detecting || processing} className="cursor-pointer" onClick={findFaces}>
              {detecting ? (loadingFaces ? 'Loading model…' : 'Detecting…') : 'Detect faces'}
            </Button>
            <p role="status" className="basis-full text-xs text-gray-600 empty:hidden order-last">{faceMsg}</p>
            <div role="radiogroup" aria-label="Effect" className="flex gap-2">
              {(['blur', 'pixelate'] as const).map(id => (
                <button key={id} type="button" role="radio" aria-checked={effect === id}
                  onClick={() => { setEffect(id); reset() }}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium cursor-pointer capitalize ${
                    effect === id ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-gray-200 hover:bg-gray-50'
                  }`}>{id}</button>
              ))}
            </div>
            <span className="text-xs text-gray-600">{rects.length} {rects.length === 1 ? 'area' : 'areas'}</span>
            <Button type="button" variant="outline" size="sm" disabled={rects.length === 0} className="cursor-pointer ml-auto"
              onClick={() => changeRects(p => p.slice(0, -1))}>Undo last</Button>
            <Button type="button" variant="outline" size="sm" disabled={rects.length === 0} className="cursor-pointer"
              onClick={() => changeRects(() => [])}>Clear</Button>
          </div>
        </div>
      )}
      <div>
        <label htmlFor="blur-radius" className="block text-sm font-medium text-gray-700 mb-1">{sliderLabel}</label>
        <input id="blur-radius" type="range" min={1} max={50} value={radius}
          onChange={e => { setRadius(Number(e.target.value)); reset() }} className="w-full" />
        <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Subtle</span><span>Strong</span></div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing || (areas && rects.length === 0)} className="w-full cursor-pointer" size="lg">
        {processing ? (loadingModel ? 'Loading model…' : 'Blurring…')
          : mode === 'background' ? 'Blur Background'
          : areas ? (effect === 'pixelate' ? 'Pixelate Areas' : 'Blur Areas')
          : 'Apply Blur'}
      </Button>
      {result && original && blurred && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ src: original, label: 'Before' }, { src: blurred, label: 'After' }].map(p => (
            <figure key={p.label} className="m-0 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={`${p.label} blur`} className="w-full max-h-80 object-contain rounded-lg border border-gray-200 bg-gray-50" />
              <figcaption className="mt-1 text-xs text-gray-600 text-center">{p.label}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {result && <ToolResult blob={result} filename={`blurred.${ext}`} label="Blur applied!" />}
    </div>
  )
}
