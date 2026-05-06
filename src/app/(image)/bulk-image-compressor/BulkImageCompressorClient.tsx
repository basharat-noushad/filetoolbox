'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { bulkCompressImages } from '@/lib/tools/image/bulkCompress'

export function BulkImageCompressorClient() {
  const [files, setFiles] = useState<File[]>([])
  const [maxSizeMB, setMaxSizeMB] = useState(1)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select at least one image.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await bulkCompressImages(files, maxSizeMB))
    } catch {
      setError('Compression failed. Please check your images and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        multiple maxFiles={20}
        onFilesSelected={setFiles}
        label="Drag & drop up to 20 images here"
        sublabel="Supports JPG, PNG, WebP — max 50MB each"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Target size per image</label>
        <div className="flex gap-3">
          {[0.5, 1, 2].map(size => (
            <button
              key={size}
              onClick={() => setMaxSizeMB(size)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer transition-colors ${maxSizeMB === size ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}
            >
              {size}MB
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? `Compressing ${files.length} images…` : `Compress ${files.length > 0 ? files.length : ''} Images`}
      </Button>
      {result && <ToolResult blob={result} filename="compressed-images.zip" label={`Successfully compressed ${files.length} images!`} />}
    </div>
  )
}
