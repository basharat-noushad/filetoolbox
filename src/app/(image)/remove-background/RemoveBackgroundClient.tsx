'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { composeBackground } from '@/lib/tools/image/composeBackground'

const SWATCHES: { name: string; value: string | null }[] = [
  { name: 'Transparent', value: null },
  { name: 'White', value: '#ffffff' },
  { name: 'Light grey', value: '#e5e7eb' },
  { name: 'Blue', value: '#2b6cb0' },
  { name: 'Red', value: '#c53030' },
]

export function RemoveBackgroundClient() {
  const [file, setFile] = useState<File | null>(null)
  const [cutout, setCutout] = useState<Blob | null>(null) // transparent PNG from the API
  const [bg, setBg] = useState<string | null>(null)
  const [jpg, setJpg] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-composite locally whenever the colour/format changes — never calls the API again.
  useEffect(() => {
    if (!cutout) { setResult(null); return }
    let cancelled = false
    composeBackground(cutout, bg, bg && jpg ? 'image/jpeg' : 'image/png')
      .then(b => { if (!cancelled) setResult(b) })
      .catch(() => { if (!cancelled) setError('Could not apply the background colour.') })
    return () => { cancelled = true }
  }, [cutout, bg, jpg])

  const handleRemoveBg = async () => {
    if (!file) { setError('Please select an image first.'); return }
    setProcessing(true); setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/remove-background', { method: 'POST', body: formData })
      if (!res.ok) {
        const msg = res.status === 503
          ? 'Background removal service is not configured. Please add a Remove.bg API key.'
          : 'Background removal failed. Please try again.'
        throw new Error(msg)
      }
      setCutout(await res.blob())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setProcessing(false)
    }
  }

  const asJpg = !!bg && jpg
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone maxSize={4_000_000}
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={f => { setFile(f[0] || null); setCutout(null); setError(null) }}
        label="Drag & drop your photo here"
        sublabel="Best results with photos of people, products, or animals"
      />
      <div className="mt-3 flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-purple-700">Powered by Remove.bg AI. Your photo is sent over HTTPS to that service. After the result arrives you can change the background colour here for free.</p>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleRemoveBg} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Removing background…' : 'Remove Background'}
      </Button>
      {cutout && (
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Background</p>
          <div className="flex flex-wrap items-center gap-2">
            {SWATCHES.map(s => (
              <button key={s.name} type="button" onClick={() => setBg(s.value)} title={s.name} aria-label={s.name} aria-pressed={bg === s.value}
                style={s.value ? { backgroundColor: s.value } : { backgroundImage: 'repeating-conic-gradient(#d1d5db 0 25%, #fff 0 50%)', backgroundSize: '12px 12px' }}
                className={`w-9 h-9 rounded-full border cursor-pointer ${bg === s.value ? 'ring-2 ring-brand-600 ring-offset-2 border-transparent' : 'border-gray-300'}`} />
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-700 ml-2 cursor-pointer">
              Custom
              <input type="color" value={bg ?? '#ffffff'} onChange={e => setBg(e.target.value)} className="w-9 h-9 p-0 border border-gray-300 rounded cursor-pointer" />
            </label>
          </div>
          {bg && (
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={jpg} onChange={e => setJpg(e.target.checked)} /> Save as JPG (smaller file) instead of PNG
            </label>
          )}
        </div>
      )}
      {result && <ToolResult blob={result} filename={`no-background.${asJpg ? 'jpg' : 'png'}`} label="Background removed successfully!" />}
    </div>
  )
}
