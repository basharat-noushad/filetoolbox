'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { convertImageFormat } from '@/lib/tools/image/convert'

export function WebpToPngClient() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!file) { setError('Please select a WebP image first.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await convertImageFormat(file, 'image/png'))
    } catch {
      setError('Conversion failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const baseName = file?.name.replace(/\.webp$/i, '') || 'converted'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/webp': ['.webp'] }}
        onFilesSelected={f => { setFile(f[0] || null); setResult(null) }}
        label="Drag & drop your WebP image here"
      />
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to PNG'}
      </Button>
      {result && <ToolResult blob={result} filename={`${baseName}.png`} label="WebP converted to PNG!" />}
    </div>
  )
}
