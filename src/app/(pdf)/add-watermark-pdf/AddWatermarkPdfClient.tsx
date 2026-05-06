'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { addWatermarkToPdf } from '@/lib/tools/pdf/watermark'

export function AddWatermarkPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.3)
  const [fontSize, setFontSize] = useState(60)
  const [rotation, setRotation] = useState(45)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProcess = async () => {
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    if (!watermarkText.trim()) { setError('Please enter watermark text.'); return }
    setProcessing(true)
    setError(null)
    try {
      setResult(await addWatermarkToPdf(files[0], watermarkText.trim(), { opacity, fontSize, rotation }))
    } catch {
      setError('An error occurred while adding the watermark. Please check your file and try again.')
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

      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Watermark Text</label>
          <input
            type="text"
            value={watermarkText}
            onChange={e => setWatermarkText(e.target.value)}
            placeholder="e.g. CONFIDENTIAL"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opacity: <span className="text-brand-600 font-semibold">{Math.round(opacity * 100)}%</span>
          </label>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={opacity}
            onChange={e => setOpacity(parseFloat(e.target.value))}
            className="w-full accent-brand-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>10% (subtle)</span>
            <span>90% (bold)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Size (pt)</label>
            <input
              type="number"
              min={10}
              max={200}
              value={fontSize}
              onChange={e => setFontSize(parseInt(e.target.value, 10) || 60)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rotation (degrees)</label>
            <input
              type="number"
              min={-180}
              max={180}
              value={rotation}
              onChange={e => setRotation(parseInt(e.target.value, 10) || 45)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
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
        {processing ? 'Adding Watermark…' : 'Add Watermark'}
      </Button>

      {result && (
        <ToolResult blob={result} filename="watermarked.pdf" label="Watermark added successfully!" />
      )}
    </div>
  )
}
