'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { svgToPng } from '@/lib/tools/image/svgToPng'

export function SvgToPngClient() {
  const [files, setFiles] = useState<File[]>([])
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select an SVG file.'); return }
    setProcessing(true); setError(null)
    try {
      const w = width ? Number(width) : undefined
      const h = height ? Number(height) : undefined
      setResult(await svgToPng(files[0], w, h))
    } catch {
      setError('Conversion failed. Please check your SVG file.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/svg+xml': ['.svg'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your SVG file here"
        sublabel="or click to browse — max 50MB"
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
          <input type="number" min={1} value={width} onChange={e => setWidth(e.target.value)} placeholder="Auto" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
          <input type="number" min={1} value={height} onChange={e => setHeight(e.target.value)} placeholder="Auto" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to PNG'}
      </Button>
      {result && <ToolResult blob={result} filename="converted.png" label="SVG converted to PNG!" />}
    </div>
  )
}
