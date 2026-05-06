'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function MemeGeneratorClient() {
  const [file, setFile] = useState<File | null>(null)
  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')
  const [fontSize, setFontSize] = useState(48)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    if (!file) { setError('Please select an image.'); return }
    setProcessing(true); setError(null)
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file!)
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(url)
          const size = fontSize
          ctx.font = `bold ${size}px Impact, Arial`
          ctx.textAlign = 'center'
          ctx.lineWidth = size / 8
          ctx.strokeStyle = '#000000'
          ctx.fillStyle = '#ffffff'
          if (topText) {
            ctx.strokeText(topText.toUpperCase(), canvas.width / 2, size + 10)
            ctx.fillText(topText.toUpperCase(), canvas.width / 2, size + 10)
          }
          if (bottomText) {
            ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 15)
            ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 15)
          }
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed')), 'image/jpeg', 0.92)
        }
        img.onerror = () => reject(new Error('Failed to load'))
        img.src = url
      })
      setResult(blob)
    } catch {
      setError('Failed to generate meme. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
        onFilesSelected={fs => setFile(fs[0])}
        label="Upload meme image"
        sublabel="JPG or PNG — max 50MB"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Top Text</label>
          <input type="text" value={topText} onChange={e => setTopText(e.target.value)} placeholder="TOP TEXT" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bottom Text</label>
          <input type="text" value={bottomText} onChange={e => setBottomText(e.target.value)} placeholder="BOTTOM TEXT" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Font Size: {fontSize}px</label>
        <input type="range" min={20} max={100} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={generate} disabled={!file || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Generating…' : 'Generate Meme'}
      </Button>
      {result && <ToolResult blob={result} filename="meme.jpg" label="Meme created!" />}
    </div>
  )
}
