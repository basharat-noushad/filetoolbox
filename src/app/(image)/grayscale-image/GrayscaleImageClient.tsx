'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { grayscaleImage } from '@/lib/tools/image/grayscale'

export function GrayscaleImageClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select an image.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await grayscaleImage(files[0]))
    } catch {
      setError('Conversion failed. Please check your image and try again.')
    } finally {
      setProcessing(false)
    }
  }

  const outName = files[0] ? files[0].name.replace(/\.[^.]+$/, '_grayscale.jpg') : 'grayscale.jpg'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your image here"
        sublabel="Supports JPG, PNG, WebP — max 50MB"
      />
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to Grayscale'}
      </Button>
      {result && <ToolResult blob={result} filename={outName} label="Image converted to grayscale!" />}
    </div>
  )
}
