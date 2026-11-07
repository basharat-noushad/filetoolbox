'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { convertToPdfA, type PdfAStage } from '@/lib/tools/pdf/pdfa'

const GS_SOURCE = 'https://github.com/okathira/ghostpdl-wasm/tree/a62b7d686b21cf88f6425b3e989d1062b9af4256'

export function PdfToPdfaClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [stage, setStage] = useState<PdfAStage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = (selected: File[]) => {
    setFiles(selected); setResult(null); setError(null)
  }

  const handleConvert = async () => {
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    setError(null); setResult(null)
    try {
      setResult(await convertToPdfA(files[0], 2, setStage))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setStage(null)
    }
  }

  const baseName = files[0]?.name.replace(/\.pdf$/i, '') || 'converted'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={handleFiles}
        label="Drag & drop your PDF here"
        sublabel="Converts to PDF/A-2b archival format, right in your browser"
      />
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={files.length === 0 || stage !== null} className="mt-4 w-full cursor-pointer" size="lg">
        {stage === 'loading' ? 'Loading engine…' : stage === 'converting' ? 'Converting…' : 'Convert to PDF/A'}
      </Button>
      {stage === 'loading' && (
        <p role="status" className="mt-2 text-sm text-gray-600 text-center">Loading conversion engine (~11 MB, first time only)…</p>
      )}
      {result && <ToolResult blob={result} filename={`${baseName}-pdfa.pdf`} label="PDF converted to PDF/A-2b!" />}
      <p className="mt-4 text-xs text-gray-500">
        Conversion uses <a href="https://www.ghostscript.com/" className="underline" target="_blank" rel="noopener noreferrer">Ghostscript</a> 10.06
        compiled to WebAssembly, © Artifex Software, licensed under the{' '}
        <a href="/ghostscript/LICENSE.txt" className="underline" target="_blank">GNU AGPL v3</a>.{' '}
        <a href={GS_SOURCE} className="underline" target="_blank" rel="noopener noreferrer">Source code</a>.
      </p>
    </div>
  )
}
