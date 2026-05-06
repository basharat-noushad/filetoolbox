'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { imageToBase64 } from '@/lib/tools/image/base64'

export function ImageToBase64Client() {
  const [files, setFiles] = useState<File[]>([])
  const [base64Result, setBase64Result] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handle = async () => {
    if (files.length === 0) { setError('Please select an image.'); return }
    setProcessing(true); setError(null)
    try {
      setBase64Result(await imageToBase64(files[0]))
    } catch {
      setError('Failed to convert image. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleCopy = () => {
    if (!base64Result) return
    navigator.clipboard.writeText(base64Result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'], 'image/gif': ['.gif'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your image here"
        sublabel="Supports JPG, PNG, WebP, GIF — max 10MB"
      />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to Base64'}
      </Button>
      {base64Result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">Base64 string ready</span>
            <button onClick={handleCopy} className="text-sm text-brand-600 hover:text-brand-700 font-medium cursor-pointer">
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
          </div>
          <textarea
            readOnly
            value={base64Result}
            className="w-full h-40 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-600 resize-y"
          />
          <p className="text-xs text-gray-400">String length: {base64Result.length.toLocaleString()} characters</p>
        </div>
      )}
    </div>
  )
}
