'use client'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { blurImage } from '@/lib/tools/image/blur'
import { blurBackground, closeSegmenter, isSegmenterLoaded, NoPersonError } from '@/lib/tools/image/backgroundBlur'

type Mode = 'whole' | 'background'

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'whole', label: 'Whole image', hint: 'Blur the entire picture' },
  { id: 'background', label: 'Background only', hint: 'Keep people sharp, blur the rest' },
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

export function BlurImageClient() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<Mode>('whole')
  const [radius, setRadius] = useState(10)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [loadingModel, setLoadingModel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const original = useObjectUrl(files[0] ?? null)
  const blurred = useObjectUrl(result)

  useEffect(() => closeSegmenter, [])

  const reset = () => { setResult(null); setError(null) }
  const onFiles = useCallback((f: File[]) => { setFiles(f); setResult(null); setError(null) }, [])

  const handle = async () => {
    if (files.length === 0) { setError('Please select an image.'); return }
    setProcessing(true); setError(null); setResult(null)
    try {
      if (mode === 'background') {
        setLoadingModel(!isSegmenterLoaded())
        setResult(await blurBackground(files[0], radius))
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
        <div role="radiogroup" aria-label="What to blur" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
      <div>
        <label htmlFor="blur-radius" className="block text-sm font-medium text-gray-700 mb-1">Blur Intensity: {radius}px</label>
        <input id="blur-radius" type="range" min={1} max={50} value={radius}
          onChange={e => { setRadius(Number(e.target.value)); reset() }} className="w-full" />
        <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Subtle</span><span>Strong</span></div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? (loadingModel ? 'Loading model…' : 'Blurring…') : mode === 'background' ? 'Blur Background' : 'Apply Blur'}
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
