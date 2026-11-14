'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function MergePdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMerge = async () => {
    if (files.length < 2) { setError('Please select at least 2 files to merge.'); return }
    setProcessing(true); setError(null)
    try {
      const { mergePdfs } = await import('@/lib/tools/pdf/merge')
      setResult(await mergePdfs(files))
    } catch {
      setError('An error occurred while merging. Please check your files and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-brand-100 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }} multiple reorderable maxFiles={20}
        onFilesSelected={f => { setFiles(f); setResult(null) }}
        label="Drag & drop PDF, JPG or PNG files here"
        sublabel="Mix PDFs and images — each JPG/PNG becomes one page sized to the image. Max 50MB each"
        privacyNote="Stays on your device — merging happens entirely in your browser, nothing is uploaded"
      />
      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}
      <Button onClick={handleMerge} disabled={files.length < 2 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Merging…' : `Merge ${files.length > 0 ? files.length + ' files' : 'files'}`}
      </Button>
      {result && <ToolResult blob={result} filename="merged.pdf" label={`Successfully merged ${files.length} files!`} />}
    </div>
  )
}
