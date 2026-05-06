'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { flattenPdf } from '@/lib/tools/pdf/flatten'

export function FlattenPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFlatten = async () => {
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await flattenPdf(files[0]))
    } catch {
      setError('Failed to flatten PDF. The file may not contain form fields, or may be corrupted.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your PDF here"
        sublabel="or click to browse — max 50MB"
      />
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleFlatten} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Flattening…' : 'Flatten PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="flattened.pdf" label="PDF flattened successfully!" />}
    </div>
  )
}
