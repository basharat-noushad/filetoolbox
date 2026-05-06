'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { adjustBrightness } from '@/lib/tools/image/brightness'

export function ImageBrightnessClient() {
  const [files, setFiles] = useState<File[]>([])
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select an image.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await adjustBrightness(files[0], brightness, contrast, saturation))
    } catch {
      setError('An error occurred. Please check your image and try again.')
    } finally {
      setProcessing(false)
    }
  }

  const Slider = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">{value}%</span>
      </div>
      <input type="range" min={0} max={200} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full" />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>0%</span><span>100%</span><span>200%</span></div>
    </div>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your image here"
        sublabel="Supports JPG, PNG, WebP — max 50MB"
      />
      <Slider label="Brightness" value={brightness} onChange={setBrightness} />
      <Slider label="Contrast" value={contrast} onChange={setContrast} />
      <Slider label="Saturation" value={saturation} onChange={setSaturation} />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Applying…' : 'Apply Adjustments'}
      </Button>
      {result && <ToolResult blob={result} filename="adjusted.jpg" label="Adjustments applied!" />}
    </div>
  )
}
