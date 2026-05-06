'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function PngToSvgClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select a PNG file.'); return }
    setProcessing(true); setError(null)
    try {
      const file = files[0]
      const img = new Image()
      const url = URL.createObjectURL(file)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load'))
        img.src = url
      })
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = e => resolve(e.target?.result as string)
        reader.onerror = () => reject(new Error('Failed to read'))
        reader.readAsDataURL(file)
      })
      URL.revokeObjectURL(url)
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${img.naturalWidth}" height="${img.naturalHeight}" viewBox="0 0 ${img.naturalWidth} ${img.naturalHeight}"><image href="${base64}" width="${img.naturalWidth}" height="${img.naturalHeight}"/></svg>`
      setResult(new Blob([svgContent], { type: 'image/svg+xml' }))
    } catch {
      setError('Conversion failed. Please check your file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
        This creates an SVG with an embedded raster image. For true vector path tracing, server-side processing is required.
      </div>
      <FileDropzone
        accept={{ 'image/png': ['.png'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your PNG file here"
        sublabel="or click to browse — max 50MB"
      />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to SVG'}
      </Button>
      {result && <ToolResult blob={result} filename="converted.svg" label="PNG converted to SVG!" />}
    </div>
  )
}
