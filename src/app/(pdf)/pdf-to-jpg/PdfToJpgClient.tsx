'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { pdfToImages } from '@/lib/tools/pdf/pdfToImages'

type Quality = '72' | '150' | '300'
const SCALES: Record<Quality, number> = { '72': 1.0, '150': 1.5, '300': 2.0 }

export function PdfToJpgClient() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState<Quality>('150')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await pdfToImages(file, 'jpeg', SCALES[quality] === 1.0 ? 0.8 : 0.92))
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
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Image Quality (DPI)</p>
        <div className="flex gap-3">
          {([['72', 'Standard'], ['150', 'High'], ['300', 'Ultra']] as [Quality, string][]).map(([q, label]) => (
            <button key={q} onClick={() => setQuality(q)}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                quality === q ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {label}<span className="block text-xs opacity-70">{q} DPI</span>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to JPG'}
      </Button>
      {result && <ToolResult blob={result} filename="pages.zip" label="PDF converted to JPG images!" />}
    </div>
  )
}
