'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { resizeImage } from '@/lib/tools/image/resize'

const PRESETS = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1280×720', w: 1280, h: 720 },
  { label: '800×600', w: 800, h: 600 },
  { label: '512×512', w: 512, h: 512 },
]

export function ResizeImageClient() {
  const [file, setFile] = useState<File | null>(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lockAspect, setLockAspect] = useState(true)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyPreset = (w: number, h: number) => { setWidth(String(w)); setHeight(String(h)) }

  const handleResize = async () => {
    if (!file) { setError('Please select an image first.'); return }
    const w = width ? Number(width) : undefined
    const h = height ? Number(height) : undefined
    if (!w && !h) { setError('Enter at least a width or height value.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await resizeImage(file, { width: w, height: h, keepAspectRatio: lockAspect }))
    } catch {
      setError('Resize failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const ext = file?.name.split('.').pop()?.toLowerCase() || 'jpg'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={f => { setFile(f[0] || null); setResult(null) }}
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
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Width (px)</label>
            <input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="e.g. 1920"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <button onClick={() => setLockAspect(!lockAspect)} title="Toggle aspect ratio lock"
            className={`mb-0.5 p-2 rounded-lg border transition-all cursor-pointer ${lockAspect ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-400'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {lockAspect
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              }
            </svg>
          </button>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Height (px)</label>
            <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 1080"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleResize} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Resizing…' : 'Resize Image'}
      </Button>
      {result && <ToolResult blob={result} filename={`resized.${ext}`} label="Image resized successfully!" />}
    </div>
  )
}
