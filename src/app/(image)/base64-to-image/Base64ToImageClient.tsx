'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ToolResult } from '@/components/tools/ToolResult'
import { base64ToImage } from '@/lib/tools/image/base64'

export function Base64ToImageClient() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (!input.trim()) { setError('Please paste a Base64 string.'); return }
    setProcessing(true); setError(null)
    try {
      let dataUrl = input.trim()
      if (!dataUrl.startsWith('data:')) {
        dataUrl = `data:image/png;base64,${dataUrl}`
      }
      setResult(await base64ToImage(dataUrl))
    } catch {
      setError('Invalid Base64 string. Please paste a valid image Base64 string.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Paste Base64 string</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste your Base64 string here (with or without data:image/...;base64, prefix)"
          className="w-full h-40 border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
        />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={!input.trim() || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Decoding…' : 'Decode to Image'}
      </Button>
      {result && <ToolResult blob={result} filename="decoded-image.png" label="Image decoded successfully!" />}
    </div>
  )
}
