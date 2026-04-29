'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { compressImage } from '@/lib/tools/image/compress'

export function CompressImageClient() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(80)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompress = async () => {
    if (!file) { setError('Please select an image first.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await compressImage(file, { quality: quality / 100, maxSizeMB: 10 }))
    } catch {
      setError('Compression failed. Please try a different image.')
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
        sublabel="Supports JPG, PNG, WebP"
      />
      {file && (
        <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          Original size: <strong>{(file.size / 1024).toFixed(1)} KB</strong>
          {result && <> → Compressed: <strong className="text-green-600">{(result.size / 1024).toFixed(1)} KB</strong>
            <span className="ml-2 text-green-600">({Math.round((1 - result.size / file.size) * 100)}% saved)</span></>}
        </div>
      )}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">Quality: {quality}%</label>
          <span className="text-xs text-gray-500">{quality < 50 ? 'Aggressive' : quality < 75 ? 'Balanced' : 'High Quality'}</span>
        </div>
        <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Smaller file</span><span>Better quality</span></div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleCompress} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Compressing…' : 'Compress Image'}
      </Button>
      {result && <ToolResult blob={result} filename={`compressed.${ext}`} label="Image compressed successfully!" />}
    </div>
  )
}
