'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { addPageNumbers } from '@/lib/tools/pdf/pageNumbers'

type Position = 'bottom-center' | 'bottom-right' | 'top-center'

const POSITIONS: { value: Position; label: string }[] = [
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-center', label: 'Top Center' },
]

export function AddPageNumbersPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [position, setPosition] = useState<Position>('bottom-center')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProcess = async () => {
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    setProcessing(true)
    setError(null)
    try {
      setResult(await addPageNumbers(files[0], position))
    } catch {
      setError('An error occurred while adding page numbers. Please check your file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => { setFiles(f); setResult(null); setError(null) }}
        label="Drag & drop your PDF here"
        sublabel="or click to browse — max 50MB"
      />

      <div className="mt-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Page Number Position</label>
        <div className="flex flex-wrap gap-3">
          {POSITIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="position"
                value={value}
                checked={position === value}
                onChange={() => setPosition(value)}
                className="accent-brand-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}

      <Button
        onClick={handleProcess}
        disabled={files.length === 0 || processing}
        className="mt-4 w-full cursor-pointer"
        size="lg"
      >
        {processing ? 'Adding Page Numbers…' : 'Add Page Numbers'}
      </Button>

      {result && (
        <ToolResult blob={result} filename="numbered.pdf" label="Page numbers added successfully!" />
      )}
    </div>
  )
}
