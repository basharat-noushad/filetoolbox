'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function RemoveBackgroundClient() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setResult(await res.blob())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={f => { setFile(f[0] || null); setResult(null) }}
        label="Drag & drop your photo here"
        sublabel="Best results with photos of people, products, or animals"
      />
      <div className="mt-3 flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-purple-700">Powered by Remove.bg AI. Results are a transparent PNG file.</p>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleRemoveBg} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Removing background…' : 'Remove Background'}
      </Button>
      {result && <ToolResult blob={result} filename="no-background.png" label="Background removed successfully!" />}
    </div>
  )
}
