'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function UnlockPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProcess = async () => {
    if (processing) return // Enter key can fire while a run is in flight
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    if (!password) { setError('Please enter the PDF password.'); return }
    setProcessing(true)
    setError(null)
    setResult(null)
    try {
      // qpdf (WebAssembly) is loaded only when the user clicks.
      const { unlockPdf, QpdfError } = await import('@/lib/tools/pdf/qpdf')
      try {
        setResult(await unlockPdf(files[0], password))
      } catch (err) {
        if (err instanceof QpdfError) setError(err.message)
        else throw err
      }
    } catch {
      setError('Failed to unlock the PDF. Please check your file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => { setFiles(f); setResult(null); setError(null) }}
        label="Drag & drop your password-protected PDF here"
      />

      <div className="mt-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">PDF Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter the current PDF password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          onKeyDown={e => { if (e.key === 'Enter') handleProcess() }}
        />
        <p className="text-xs text-gray-400 mt-1">Unlocking happens entirely in your browser. Your file and password never leave your device.</p>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}

      <Button
        onClick={handleProcess}
        disabled={files.length === 0 || processing}
        className="mt-4 w-full cursor-pointer"
        size="lg"
      >
        {processing ? 'Unlocking…' : 'Unlock PDF'}
      </Button>

      {result && (
        <ToolResult blob={result} filename="unlocked.pdf" label="PDF unlocked successfully!" />
      )}
    </div>
  )
}
