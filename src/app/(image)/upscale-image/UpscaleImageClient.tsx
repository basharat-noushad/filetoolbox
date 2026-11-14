'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { AI_MAX_EDGE, applyAlpha, readPixels, runUpscale, type AIProgress, type AIScale } from '@/lib/tools/image/esrgan'

type Mode = 'ai' | 'fast'
type Fmt = 'png' | 'jpg'

const chip = (on: boolean) =>
  `px-5 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`

const fmtEta = (s: number) => (s < 90 ? `${Math.ceil(s)} s` : `${Math.ceil(s / 60)} min`)

export function UpscaleImageClient() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<Mode>('ai')
  const [aiScale, setAiScale] = useState<AIScale>(4)
  const [fastScale, setFastScale] = useState(2)
  const [fmt, setFmt] = useState<Fmt>('png')
  const [quality, setQuality] = useState(92)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [shrink, setShrink] = useState(false)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<AIProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null)
  const [afterUrl, setAfterUrl] = useState<string | null>(null)
  const [split, setSplit] = useState(50)
  const cancelRef = useRef<(() => void) | null>(null)

  const file = files[0]
  const maxEdge = AI_MAX_EDGE[aiScale]
  const tooBig = mode === 'ai' && !!dims && Math.max(dims.w, dims.h) > maxEdge
  const isPhone = typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent)

  const reset = () => { setCanvas(null); setResult(null); setError(null); setProgress(null) }

  useEffect(() => {
    reset(); setShrink(false); setDims(null)
    if (!file) { setBeforeUrl(null); return }
    const url = URL.createObjectURL(file)
    setBeforeUrl(url)
    createImageBitmap(file).then(b => { setDims({ w: b.width, h: b.height }); b.close() }).catch(() => setError('Could not read this image.'))
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => { reset(); setShrink(false) }, [mode, aiScale, fastScale])

  // Encode whenever the canvas or output format changes.
  useEffect(() => {
    if (!canvas) { setResult(null); return }
    let live = true
    const jpg = fmt === 'jpg'
    let src = canvas
    if (jpg) { // JPG has no alpha: flatten onto white
      src = document.createElement('canvas'); src.width = canvas.width; src.height = canvas.height
      const c = src.getContext('2d')!
      c.fillStyle = '#fff'; c.fillRect(0, 0, src.width, src.height); c.drawImage(canvas, 0, 0)
    }
    src.toBlob(b => { if (!live) return; if (b) setResult(b); else setError('Could not encode the result. Try a smaller image or PNG.') }, jpg ? 'image/jpeg' : 'image/png', quality / 100)
    return () => { live = false }
  }, [canvas, fmt, quality])

  useEffect(() => {
    if (!result) { setAfterUrl(null); return }
    const u = URL.createObjectURL(result)
    setAfterUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [result])

  const handle = async () => {
    if (!file) { setError('Please select an image.'); return }
    reset(); setProcessing(true)
    try {
      const bmp = await createImageBitmap(file)
      try {
        if (mode === 'fast') {
          const c = document.createElement('canvas')
          c.width = bmp.width * fastScale; c.height = bmp.height * fastScale
          const ctx = c.getContext('2d')!
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(bmp, 0, 0, c.width, c.height)
          setCanvas(c)
        } else {
          const { w, h, img } = readPixels(bmp, shrink ? maxEdge : Infinity)
          if (Math.max(w, h) > maxEdge) { setError(`This image is too large for ${aiScale}× AI upscaling. Use the "Resize to fit" button first.`); return }
          // copy so the worker can take ownership of the buffer while we keep the alpha source
          const job = runUpscale(new Uint8ClampedArray(img.data), w, h, aiScale, setProgress)
          cancelRef.current = job.cancel
          const out = await job.promise
          const data = new ImageData(new Uint8ClampedArray(out.data.buffer as ArrayBuffer), out.w, out.h)
          applyAlpha(img, data)
          const c = document.createElement('canvas'); c.width = out.w; c.height = out.h
          c.getContext('2d')!.putImageData(data, 0, 0)
          setCanvas(c)
        }
      } finally { bmp.close() }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        setError(e instanceof Error && /memory|alloc/i.test(e.message)
          ? 'Not enough memory for this image. Try a smaller image or 2×.'
          : 'Upscaling failed. Try a smaller image, or use the non-AI option.')
      }
    } finally {
      cancelRef.current = null
      setProcessing(false)
    }
  }

  useEffect(() => () => cancelRef.current?.(), [])

  const outW = dims ? Math.round((shrink && tooBig ? Math.min(1, maxEdge / Math.max(dims.w, dims.h)) : 1) * dims.w) * (mode === 'ai' ? aiScale : fastScale) : 0
  const ext = fmt === 'jpg' ? 'jpg' : 'png'
  const base = file ? file.name.replace(/\.[^.]+$/, '') : 'image'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your image here"
        sublabel="Supports JPG, PNG, WebP. Nothing is uploaded."
      />

      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">Method</p>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Method">
          <button role="radio" aria-checked={mode === 'ai'} onClick={() => setMode('ai')} className={chip(mode === 'ai')}>AI upscale (sharper)</button>
          <button role="radio" aria-checked={mode === 'fast'} onClick={() => setMode('fast')} className={chip(mode === 'fast')}>Enlarge without AI (fast)</button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {mode === 'ai'
            ? 'Real-ESRGAN neural network, running on your device. The first use downloads a ~5 MB model. The AI invents plausible detail; it cannot recover what is truly missing.'
            : 'Plain browser interpolation. Instant, but it only enlarges pixels and does not add detail.'}
        </p>
      </div>

      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">Scale factor</p>
        <div className="flex gap-3">
          {(mode === 'ai' ? [2, 4] : [2, 3, 4]).map(s => {
            const on = (mode === 'ai' ? aiScale : fastScale) === s
            return (
              <button key={s} aria-pressed={on} onClick={() => (mode === 'ai' ? setAiScale(s as AIScale) : setFastScale(s))} className={chip(on)}>{s}×</button>
            )
          })}
        </div>
        {dims && <p className="text-sm text-gray-500 mt-2">{dims.w}×{dims.h} px → {outW}×{Math.round(outW * dims.h / dims.w)} px</p>}
      </div>

      {tooBig && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
          <span>AI {aiScale}× works on images up to {maxEdge} px on the long edge (this one is {Math.max(dims!.w, dims!.h)} px).</span>
          {!shrink
            ? <button className="underline font-medium cursor-pointer" onClick={() => setShrink(true)}>Resize to fit</button>
            : <span className="font-medium">Will be resized to {maxEdge} px first.</span>}
        </div>
      )}
      {mode === 'ai' && isPhone && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Phones can be slow at AI upscaling and may run out of memory on large images. Smaller images work best.
        </p>
      )}

      <div>
        <p className="block text-sm font-medium text-gray-700 mb-2">Save as</p>
        <div className="flex flex-wrap items-center gap-3">
          <button aria-pressed={fmt === 'png'} onClick={() => setFmt('png')} className={chip(fmt === 'png')}>PNG</button>
          <button aria-pressed={fmt === 'jpg'} onClick={() => setFmt('jpg')} className={chip(fmt === 'jpg')}>JPG</button>
          {fmt === 'jpg' && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Quality {quality}
              <input type="range" min={50} max={100} value={quality} onChange={e => setQuality(+e.target.value)} />
            </label>
          )}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      {processing && mode === 'ai' && (
        <div aria-live="polite" className="space-y-2">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress ? (progress.done / progress.total) * 100 : 3}%` }} />
          </div>
          <p className="text-sm text-gray-600">
            {progress
              ? `Tile ${progress.done}/${progress.total}${progress.etaSec != null ? `, about ${fmtEta(progress.etaSec)} left` : ''} (${progress.backend === 'webgpu' ? 'GPU' : 'CPU, slower'})`
              : 'Loading the AI model…'}
          </p>
          {progress?.backend === 'wasm' && <p className="text-sm text-gray-500">Your browser has no WebGPU, so this runs on the CPU. Large images can take several minutes.</p>}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handle} disabled={!file || processing || (tooBig && !shrink)} className="flex-1 cursor-pointer" size="lg">
          {processing ? 'Upscaling…' : `Upscale Image ${mode === 'ai' ? aiScale : fastScale}×`}
        </Button>
        {processing && mode === 'ai' && (
          <Button variant="outline" size="lg" className="cursor-pointer" onClick={() => cancelRef.current?.()}>Cancel</Button>
        )}
      </div>

      {result && afterUrl && beforeUrl && (
        <>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Compare: original (left) vs upscaled (right)</p>
            <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 select-none" style={{ aspectRatio: `${canvas!.width} / ${canvas!.height}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={afterUrl} alt="Upscaled result" className="absolute inset-0 w-full h-full object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={beforeUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain" style={{ clipPath: `inset(0 ${100 - split}% 0 0)`, imageRendering: 'pixelated' }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow pointer-events-none" style={{ left: `${split}%` }} />
              <input type="range" min={0} max={100} value={split} onChange={e => setSplit(+e.target.value)} aria-label="Comparison slider"
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" />
            </div>
          </div>
          <ToolResult blob={result} filename={`${base}-${mode === 'ai' ? aiScale : fastScale}x.${ext}`} label={`Image upscaled ${mode === 'ai' ? aiScale : fastScale}× (${canvas!.width}×${canvas!.height})`} />
        </>
      )}
    </div>
  )
}
