'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { convertImageFormat } from '@/lib/tools/image/convert'

export function ImageToWebpClient() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(85)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!file) { setError('Please select an image first.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await convertImageFormat(file, 'image/webp', quality / 100))
    } catch {
      setError('Conversion failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const baseName = file?.name.replace(/\.(jpg|jpeg|png)$/i, '') || 'image'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
        onFilesSelected={f => { setFile(f[0] || null); setResult(null) }}
        label="Drag & drop your JPG or PNG here"
      />
      {file && result && (
        <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          Original: <strong>{(file.size / 1024).toFixed(1)} KB</strong>
          {' → '}WebP: <strong className="text-green-600">{(result.size / 1024).toFixed(1)} KB</strong>
          <span className="ml-2 text-green-600">({Math.round((1 - result.size / file.size) * 100)}% saved)</span>
        </div>
      )}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">WebP Quality: {quality}%</label>
        </div>
        <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Smaller file</span><span>Better quality</span></div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to WebP'}
      </Button>
      {result && <ToolResult blob={result} filename={`${baseName}.webp`} label="Converted to WebP successfully!" />}
    </div>
  )
}
