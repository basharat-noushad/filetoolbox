'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function UpscaleImageClient() {
  const [files, setFiles] = useState<File[]>([])
  const [scale, setScale] = useState(2)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select an image.'); return }
    setProcessing(true); setError(null)
    try {
      const file = files[0]
      const blob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth * scale
          canvas.height = img.naturalHeight * scale
          const ctx = canvas.getContext('2d')!
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          URL.revokeObjectURL(url)
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed')), 'image/png')
        }
        img.onerror = () => reject(new Error('Failed to load'))
        img.src = url
      })
      setResult(blob)
    } catch {
      setError('Upscaling failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        Uses high-quality bicubic interpolation. AI upscaling (Real-ESRGAN) requires API configuration.
      </div>
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your image here"
        sublabel="Supports JPG, PNG, WebP — max 20MB recommended"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Scale factor</label>
        <div className="flex gap-3">
          {[2, 3, 4].map(s => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`px-5 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${scale === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Upscaling…' : `Upscale Image ${scale}x`}
      </Button>
      {result && <ToolResult blob={result} filename="upscaled.png" label={`Image upscaled ${scale}x!`} />}
    </div>
  )
}
