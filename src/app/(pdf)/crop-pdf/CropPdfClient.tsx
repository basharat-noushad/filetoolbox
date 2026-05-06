'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { cropPdf } from '@/lib/tools/pdf/cropPdf'
import type { CropMargins } from '@/lib/tools/pdf/cropPdf'

export function CropPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [margins, setMargins] = useState<CropMargins>({ top: 0, right: 0, bottom: 0, left: 0 })
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setMargin = (side: keyof CropMargins, val: string) => {
    setMargins(m => ({ ...m, [side]: Math.max(0, Number(val) || 0) }))
  }

  const handleCrop = async () => {
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await cropPdf(files[0], margins))
    } catch {
      setError('Failed to crop PDF. Please check your file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your PDF here"
        sublabel="or click to browse — max 50MB"
      />
      <div className="grid grid-cols-2 gap-3">
        {(['top', 'right', 'bottom', 'left'] as const).map(side => (
          <div key={side}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{side} margin (pt)</label>
            <input type="number" min={0} value={margins[side]} onChange={e => setMargin(side, e.target.value)} className={inputCls} />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">1 inch = 72 pt. Leave all at 0 to keep original margins.</p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleCrop} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Cropping…' : 'Crop PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="cropped.pdf" label="PDF cropped successfully!" />}
    </div>
  )
}
