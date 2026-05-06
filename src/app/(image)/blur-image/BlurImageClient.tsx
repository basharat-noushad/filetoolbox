'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { blurImage } from '@/lib/tools/image/blur'

export function BlurImageClient() {
  const [files, setFiles] = useState<File[]>([])
  const [radius, setRadius] = useState(10)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select an image.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await blurImage(files[0], radius))
    } catch {
      setError('An error occurred. Please check your image and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your image here"
        sublabel="Supports JPG, PNG, WebP — max 50MB"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Blur Intensity: {radius}px</label>
        <input type="range" min={1} max={50} value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Subtle</span><span>Strong</span></div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Blurring…' : 'Apply Blur'}
      </Button>
      {result && <ToolResult blob={result} filename="blurred.jpg" label="Blur applied!" />}
    </div>
  )
}
