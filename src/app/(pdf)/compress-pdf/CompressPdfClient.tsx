'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function CompressPdfClient() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompress = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    setProcessing(true); setError(null)
    try {
      const { compressPdf } = await import('@/lib/tools/pdf/compress')
      setResult(await compressPdf(file))
    } catch {
      setError('Compression failed. Please try a different file.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => { setFile(f[0] || null); setResult(null); setError(null) }}
        label="Drag & drop your PDF here"
      />
      <p className="mt-4 text-sm text-gray-600 leading-relaxed">
        Optimizes PDF structure without reducing image resolution. Savings vary;
        already optimized PDFs and scans may not get smaller. Maximum file size: 50 MB.
      </p>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleCompress} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Compressing…' : 'Compress PDF'}
      </Button>
      {result && file && <ToolResult blob={result} filename="compressed.pdf"
        label={result.size < file.size
          ? `Saved ${((file.size - result.size) / 1024).toFixed(1)} KB (${Math.round((1 - result.size / file.size) * 100)}%)`
          : 'No size reduction — your original PDF is ready to download.'} />}
    </div>
  )
}
