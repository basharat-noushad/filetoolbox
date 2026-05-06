'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { heicToJpg } from '@/lib/tools/image/heicToJpg'

export function HeicToJpgClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select a HEIC file.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await heicToJpg(files[0]))
    } catch {
      setError('Conversion failed. Make sure you have a valid HEIC/HEIF file.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        HEIC files are used by iPhones (iOS 11+). This tool converts them to JPG for universal compatibility.
      </div>
      <FileDropzone
        accept={{ 'image/heic': ['.heic', '.heif'], 'image/heif': ['.heif', '.heic'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your HEIC file here"
        sublabel="Supports .heic and .heif — max 50MB"
      />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to JPG'}
      </Button>
      {result && <ToolResult blob={result} filename="converted.jpg" label="HEIC converted to JPG!" />}
    </div>
  )
}
