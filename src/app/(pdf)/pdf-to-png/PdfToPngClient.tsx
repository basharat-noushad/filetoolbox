'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { pdfToImages } from '@/lib/tools/pdf/pdfToImages'

type Dpi = 72 | 150 | 300

export function PdfToPngClient() {
  const [file, setFile] = useState<File | null>(null)
  const [dpi, setDpi] = useState<Dpi>(150)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await pdfToImages(file, 'png', 1, dpi))
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
        onFilesSelected={f => { setFile(f[0] || null); setResult(null) }}
        label="Drag & drop your PDF here"
      />
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Resolution (DPI)</p>
        <div className="flex gap-3">
          {([72, 150, 300] as Dpi[]).map(d => (
            <button key={d} onClick={() => { setDpi(d); setResult(null) }} aria-pressed={dpi === d}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                dpi === d ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {d} DPI<span className="block text-xs opacity-70">{d === 72 ? 'Screen' : d === 150 ? 'Standard' : 'Print quality'}</span>
            </button>
          ))}
        </div>
        {dpi === 300 && <p className="mt-2 text-xs text-amber-700">300 DPI makes large files, especially for PDFs with many pages. Use 150 DPI if the download is too big.</p>}
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to PNG'}
      </Button>
      {result && <ToolResult blob={result} filename="pages.zip" label="PDF converted to PNG images!" />}
    </div>
  )
}
