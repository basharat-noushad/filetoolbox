'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { convertImageFormat } from '@/lib/tools/image/convert'
import JSZip from 'jszip'

export function JpgToPngClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (files.length === 0) { setError('Please select at least one JPG image.'); return }
    setProcessing(true); setError(null)
    try {
      if (files.length === 1) {
        setResult(await convertImageFormat(files[0], 'image/png'))
      } else {
        const zip = new JSZip()
        for (const f of files) {
          const blob = await convertImageFormat(f, 'image/png')
          zip.file(f.name.replace(/\.(jpg|jpeg)$/i, '.png'), blob)
        }
        setResult(await zip.generateAsync({ type: 'blob' }))
      }
    } catch {
      setError('Conversion failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'] }} multiple maxFiles={20}
        onFilesSelected={setFiles}
        label="Drag & drop JPG images here"
        sublabel="Multiple files supported — lossless conversion"
      />
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : `Convert ${files.length > 0 ? files.length + ' file' + (files.length > 1 ? 's' : '') : ''} to PNG`}
      </Button>
      {result && <ToolResult blob={result} filename={files.length > 1 ? 'converted.zip' : `${files[0]?.name.replace(/\.(jpg|jpeg)$/i, '')}.png`} label="Converted to PNG successfully!" />}
    </div>
  )
}
