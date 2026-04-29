'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { splitPdf } from '@/lib/tools/pdf/split'

function parseRanges(input: string): [number, number][] | null {
  const parts = input.split(',').map(s => s.trim()).filter(Boolean)
  const ranges: [number, number][] = []
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      if (isNaN(a) || isNaN(b) || a < 1 || b < a) return null
      ranges.push([a, b])
    } else {
      const n = Number(part)
      if (isNaN(n) || n < 1) return null
      ranges.push([n, n])
    }
  }
  return ranges.length > 0 ? ranges : null
}

export function SplitPdfClient() {
  const [file, setFile] = useState<File | null>(null)
  const [rangeInput, setRangeInput] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSplit = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    const ranges = parseRanges(rangeInput)
    if (!ranges) { setError('Invalid page ranges. Use format like "1-3, 5, 7-9".'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await splitPdf(file, ranges))
    } catch {
      setError('Split failed. Please check your page ranges and try again.')
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Page Ranges</label>
        <input
          type="text" value={rangeInput} onChange={e => setRangeInput(e.target.value)}
          placeholder="e.g. 1-3, 5, 7-9"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Each range becomes a separate PDF part</p>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleSplit} disabled={!file || !rangeInput || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Splitting…' : 'Split PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="split.zip" label="PDF split successfully!" />}
    </div>
  )
}
