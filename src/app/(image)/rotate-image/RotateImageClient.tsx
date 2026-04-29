'use client'
import { useState } from 'react'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { rotateImage } from '@/lib/tools/image/rotate'

export function RotateImageClient() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDeg, setCurrentDeg] = useState(0)

  const handleFiles = (f: File[]) => {
    setFile(f[0] || null)
    setResult(null)
    setCurrentDeg(0)
    if (f[0]) setPreview(URL.createObjectURL(f[0]))
  }

  const handleRotate = async (deg: 90 | 180 | 270) => {
    if (!file) { setError('Please select an image first.'); return }
    setProcessing(true); setError(null)
    try {
      const blob = await rotateImage(file, deg)
      setResult(blob)
      if (preview) URL.revokeObjectURL(preview)
      setPreview(URL.createObjectURL(blob))
      setCurrentDeg((currentDeg + deg) % 360)
    } catch {
      setError('Rotation failed. Please try again.')
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
      <div className="mt-4 flex gap-3 justify-center">
        <button onClick={() => handleRotate(270)} disabled={!file || processing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-600 transition-all cursor-pointer disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" style={{ transform: 'scaleX(-1)' }} />
          </svg>
          90° Left
        </button>
        <button onClick={() => handleRotate(90)} disabled={!file || processing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-600 transition-all cursor-pointer disabled:opacity-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          90° Right
        </button>
        <button onClick={() => handleRotate(180)} disabled={!file || processing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-600 transition-all cursor-pointer disabled:opacity-50">
          180°
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      {result && <ToolResult blob={result} filename={`rotated.${ext}`} label="Image rotated successfully!" />}
    </div>
  )
}
