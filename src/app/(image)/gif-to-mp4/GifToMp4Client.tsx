'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { gifToMp4 } from '@/lib/tools/image/ffmpegConvert'

export function GifToMp4Client() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select a GIF file.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await gifToMp4(files[0]))
    } catch {
      setError('Conversion failed. Please check your GIF file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        Note: First conversion loads FFmpeg (~30MB). Subsequent conversions in the same session are instant.
      </div>
      <FileDropzone
        accept={{ 'image/gif': ['.gif'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your GIF file here"
        sublabel="or click to browse — max 50MB"
      />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Converting (may take a moment)…' : 'Convert to MP4'}
      </Button>
      {result && <ToolResult blob={result} filename="converted.mp4" label="GIF converted to MP4!" />}
    </div>
  )
}
