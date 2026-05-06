'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { extractPdfPages } from '@/lib/tools/pdf/extractPages'

function parsePageInput(input: string): number[] {
  const pages: number[] = []
  const parts = input.split(',').map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) pages.push(i)
      }
    } else {
      const n = Number(part)
      if (!isNaN(n)) pages.push(n)
    }
  }
  return [...new Set(pages)].sort((a, b) => a - b)
}

export function ExtractPdfPagesClient() {
  const [files, setFiles] = useState<File[]>([])
  const [pageInput, setPageInput] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    const pages = parsePageInput(pageInput)
    if (pages.length === 0) { setError('Please enter valid page numbers (e.g. 1,3,5-7).'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await extractPdfPages(files[0], pages))
    } catch {
      setError('Failed to extract pages. Please check your file and page numbers.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your PDF here"
        sublabel="or click to browse — max 50MB"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pages to extract</label>
        <input
          type="text"
          value={pageInput}
          onChange={e => setPageInput(e.target.value)}
          placeholder="e.g. 1,3,5-7"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <p className="text-xs text-gray-400 mt-1">Use commas for individual pages and hyphens for ranges.</p>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleExtract} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Extracting…' : 'Extract Pages'}
      </Button>
      {result && <ToolResult blob={result} filename="extracted-pages.pdf" label={`Pages extracted successfully!`} />}
    </div>
  )
}
