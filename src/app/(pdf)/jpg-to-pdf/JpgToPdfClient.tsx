'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { imagesToPdf } from '@/lib/tools/pdf/imagesToPdf'

export function JpgToPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (files.length === 0) { setError('Please select at least one image.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await imagesToPdf(files))
    } catch {
      setError('Conversion failed. Please ensure all files are valid JPG or PNG images.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
        multiple maxFiles={20}
        onFilesSelected={setFiles}
        label="Drag & drop your images here"
        sublabel="Supports JPG, JPEG, PNG — select multiple files"
      />
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : `Convert ${files.length > 0 ? files.length + ' image' + (files.length > 1 ? 's' : '') : ''} to PDF`}
      </Button>
      {result && <ToolResult blob={result} filename="images.pdf" label={`${files.length} image(s) converted to PDF!`} />}
    </div>
  )
}
