'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { pdfToImages } from '@/lib/tools/pdf/pdfToImages'

export function PdfToPngClient() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await pdfToImages(file, 'png', 1))
    } catch {
      setError('Conversion failed. Make sure pdf.worker.min.js is in the public folder.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => setFile(f[0] || null)}
        label="Drag & drop your PDF here"
      />
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        PNG images are rendered at high resolution (2×) with transparency support.
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to PNG'}
      </Button>
      {result && <ToolResult blob={result} filename="pages.zip" label="PDF converted to PNG images!" />}
    </div>
  )
}
