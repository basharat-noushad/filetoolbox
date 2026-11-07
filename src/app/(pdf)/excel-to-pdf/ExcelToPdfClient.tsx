'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function ExcelToPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (files.length === 0) { setError('Please select an Excel file.'); return }
    setProcessing(true); setError(null)
    try {
      const formData = new FormData()
      formData.append('file', files[0])
      const res = await fetch('/api/excel-to-pdf', { method: 'POST', body: formData })
      // Statuses below carry a plain-text message written by our own API route.
      if (!res.ok) throw new Error([413, 415, 422, 429, 503, 504].includes(res.status) && (await res.text()).slice(0, 300) || 'Conversion failed. Please try again.')
      setResult(await res.blob())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone maxSize={4_000_000}
        accept={{
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
          'application/vnd.ms-excel': ['.xls'],
        }}
        onFilesSelected={f => { setFiles(f); setResult(null); setError(null) }}
        label="Drag & drop your Excel file here"
        sublabel="Supports .xlsx and .xls — max 4MB"
      />
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="converted.pdf" label="Excel converted to PDF!" />}
    </div>
  )
}
