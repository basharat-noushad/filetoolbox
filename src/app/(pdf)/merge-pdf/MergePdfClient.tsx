'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { mergePdfs } from '@/lib/tools/pdf/merge'

export function MergePdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMerge = async () => {
    if (files.length < 2) { setError('Please select at least 2 PDF files to merge.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await mergePdfs(files))
    } catch {
      setError('An error occurred while merging. Please check your files and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }} multiple maxFiles={20}
        onFilesSelected={setFiles}
        label="Drag & drop PDF files here"
        sublabel="Select multiple files — max 50MB each"
      />
      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}
      <Button onClick={handleMerge} disabled={files.length < 2 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Merging…' : `Merge ${files.length > 0 ? files.length : ''} PDFs`}
      </Button>
      {result && <ToolResult blob={result} filename="merged.pdf" label={`Successfully merged ${files.length} PDFs!`} />}
    </div>
  )
}
