'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function PdfToPptClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    setProcessing(true); setError(null)
    try {
      const formData = new FormData()
      formData.append('file', files[0])
      const res = await fetch('/api/pdf-to-ppt', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Conversion failed. Please try again.')
      setResult(await res.blob())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
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
        sublabel="Each page becomes a slide — max 50MB"
      />
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to PowerPoint'}
      </Button>
      {result && <ToolResult blob={result} filename="converted.pptx" label="PDF converted to PowerPoint!" />}
    </div>
  )
}
