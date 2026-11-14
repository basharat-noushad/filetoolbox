'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { addWatermarkToImage, addLogoToImage } from '@/lib/tools/image/addWatermark'

type Position = 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

export function AddWatermarkImageClient() {
  const [files, setFiles] = useState<File[]>([])
  const [text, setText] = useState('© MyBrand')
  const [opacity, setOpacity] = useState(50)
  const [position, setPosition] = useState<Position>('bottom-right')
  const [mode, setMode] = useState<'text' | 'logo'>('text')
  const [logo, setLogo] = useState<File[]>([])
  const [sizePct, setSizePct] = useState(20)
  const [tile, setTile] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setResult(null) }, [files, logo, mode, text, opacity, position, sizePct, tile])

  const handle = async () => {
    if (files.length === 0) { setError('Please select an image.'); return }
    if (mode === 'text' && !text.trim()) { setError('Please enter watermark text.'); return }
    if (mode === 'logo' && logo.length === 0) { setError('Please select a logo image.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(mode === 'text'
        ? await addWatermarkToImage(files[0], text, { opacity: opacity / 100, position })
        : await addLogoToImage(files[0], logo[0], { opacity: opacity / 100, position, sizePct, tile }))
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
      <div className="inline-flex rounded-lg border border-gray-300 p-0.5 text-sm" role="group" aria-label="Watermark type">
        {(['text', 'logo'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
            className={`px-4 py-1.5 rounded-md cursor-pointer ${mode === m ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
            {m === 'text' ? 'Text' : 'Logo / image'}
          </button>
        ))}
      </div>
      {mode === 'logo' && (
        <div className="space-y-4">
          <FileDropzone
            accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/svg+xml': ['.svg'] }}
            onFilesSelected={setLogo}
            label="Drop your logo here"
            sublabel="PNG, JPG or SVG — transparent PNG/SVG stays transparent"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo size: {sizePct}% of image width</label>
            <input type="range" min={5} max={80} value={sizePct} onChange={e => setSizePct(Number(e.target.value))} className="w-full" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={tile} onChange={e => setTile(e.target.checked)} /> Repeat logo across the whole image
          </label>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mode === 'text' && <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Watermark text</label>
          <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>}
        {!(mode === 'logo' && tile) && <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <select value={position} onChange={e => setPosition(e.target.value as Position)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="center">Center</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
          </select>
        </div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Opacity: {opacity}%</label>
        <input type="range" min={10} max={90} value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Adding Watermark…' : mode === 'logo' ? 'Add Logo' : 'Add Watermark'}
      </Button>
      {result && <ToolResult blob={result} filename={`watermarked.${result.type === 'image/png' ? 'png' : result.type === 'image/webp' ? 'webp' : 'jpg'}`} label="Watermark added!" />}
    </div>
  )
}
