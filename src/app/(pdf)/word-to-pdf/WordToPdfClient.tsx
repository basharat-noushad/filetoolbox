'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function WordToPdfClient() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!file) { setError('Please select a Word document first.'); return }
    setProcessing(true); setError(null); setStatus('Converting…')
    const timer = setTimeout(() => setStatus('Waking up the conversion server — this takes ~60s on first use…'), 8000)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/word-to-pdf', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Conversion failed. Please try again.')
      setResult(await res.blob())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      clearTimeout(timer)
      setProcessing(false)
      setStatus(null)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] }}
        onFilesSelected={f => setFile(f[0] || null)}
        label="Drag & drop your Word document here"
        sublabel="Supports .docx and .doc formats — max 50MB"
      />
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      {status && !error && <p className="mt-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">{status}</p>}
      <Button onClick={handleConvert} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? (status ?? 'Converting…') : 'Convert to PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="converted.pdf" label="Word document converted to PDF!" />}
    </div>
  )
}
