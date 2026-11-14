'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { heicBatchToJpg } from '@/lib/tools/image/heicToJpg'

export function HeicToJpgClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handle = async () => {
    if (files.length === 0) { setError('Please select a HEIC file.'); return }
    setProcessing(true); setError(null); setResult(null); setDone(0)
    try {
      setResult(await heicBatchToJpg(files, setDone))
    } catch {
      setError('Conversion failed. Make sure every file is a valid HEIC/HEIF file.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        HEIC files are used by iPhones (iOS 11+). This tool converts them to JPG for universal compatibility.
      </div>
      <FileDropzone multiple maxFiles={20}
        accept={{ 'image/heic': ['.heic', '.heif'], 'image/heif': ['.heif', '.heic'] }}
        onFilesSelected={f => { setFiles(f); setResult(null) }}
        label="Drag & drop your HEIC files here"
        sublabel="Up to 20 files (.heic, .heif) — max 50MB each"
      />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? `Converting ${Math.min(done + 1, files.length)} of ${files.length}…` : files.length > 1 ? `Convert ${files.length} files to JPG` : 'Convert to JPG'}
      </Button>
      {processing && files.length > 1 && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-brand-600 transition-all" style={{ width: `${(done / files.length) * 100}%` }} /></div>
      )}
      {result && <ToolResult blob={result.blob} filename={result.filename} label={files.length > 1 ? `${files.length} HEIC files converted to JPG!` : 'HEIC converted to JPG!'} />}
    </div>
  )
}
