'use client'
import { useState } from 'react'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { flipImage } from '@/lib/tools/image/flip'

export function FlipImageClient() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = (f: File[]) => {
    setFile(f[0] || null); setResult(null)
    if (f[0]) setPreview(URL.createObjectURL(f[0]))
  }

  const handleFlip = async (dir: 'horizontal' | 'vertical') => {
    if (!file) { setError('Please select an image first.'); return }
    setProcessing(true); setError(null)
    try {
      const blob = await flipImage(file, dir)
      setResult(blob)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(URL.createObjectURL(blob))
    } catch {
      setError('Flip failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const ext = file?.name.split('.').pop()?.toLowerCase() || 'jpg'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={handleFiles}
        label="Drag & drop your image here"
      />
      {preview && (
        <div className="mt-4 flex justify-center">
          <img src={preview} alt="Preview" className="max-h-56 max-w-full rounded-lg border border-gray-200 object-contain" />
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => handleFlip('horizontal')} disabled={!file || processing}
          className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition-all cursor-pointer disabled:opacity-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Flip Horizontal
        </button>
        <button onClick={() => handleFlip('vertical')} disabled={!file || processing}
          className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition-all cursor-pointer disabled:opacity-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(90deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Flip Vertical
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      {result && <ToolResult blob={result} filename={`flipped.${ext}`} label="Image flipped successfully!" />}
    </div>
  )
}
