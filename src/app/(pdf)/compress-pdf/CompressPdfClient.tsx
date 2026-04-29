'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { compressPdf } from '@/lib/tools/pdf/compress'

type Level = 'low' | 'medium' | 'high'

export function CompressPdfClient() {
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<Level>('medium')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompress = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    setProcessing(true); setError(null)
    try {
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
        onFilesSelected={f => setFile(f[0] || null)}
        label="Drag & drop your PDF here"
      />
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Compression Level</p>
        <div className="flex gap-3">
          {(['low', 'medium', 'high'] as Level[]).map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-all cursor-pointer ${
                level === l ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleCompress} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Compressing…' : 'Compress PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="compressed.pdf" label="PDF compressed successfully!" />}
    </div>
  )
}
