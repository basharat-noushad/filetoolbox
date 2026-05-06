'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { addTextToImage } from '@/lib/tools/image/addText'

export function AddTextToImageClient() {
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(48)
  const [color, setColor] = useState('#ffffff')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select an image.'); return }
    if (!text.trim()) { setError('Please enter text to add.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await addTextToImage(files[0], text, { fontSize, color }))
    } catch {
      setError('An error occurred. Please check your image and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your image here"
        sublabel="Supports JPG, PNG, WebP — max 50MB"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
        <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Enter text to add to image" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Font Size: {fontSize}px</label>
          <input type="range" min={12} max={200} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-9 border border-gray-300 rounded-lg cursor-pointer" />
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Adding Text…' : 'Add Text to Image'}
      </Button>
      {result && <ToolResult blob={result} filename="image-with-text.jpg" label="Text added to image!" />}
    </div>
  )
}
