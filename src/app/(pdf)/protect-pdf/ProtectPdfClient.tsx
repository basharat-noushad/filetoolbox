'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

export function ProtectPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProtect = async () => {
    if (processing) return
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    if (!password) { setError('Please enter a password.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setProcessing(true); setError(null); setResult(null)
    try {
      // qpdf (WebAssembly) is loaded only when the user clicks.
      const { protectPdf, QpdfError } = await import('@/lib/tools/pdf/qpdf')
      try {
        setResult(await protectPdf(files[0], password))
      } catch (err) {
        if (err instanceof QpdfError) setError(err.message)
        else throw err
      }
    } catch {
      setError('Failed to protect PDF. Please check your file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => { setFiles(f); setResult(null); setError(null) }}
        label="Drag & drop your PDF here"
      />
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Confirm password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
      <p className="text-xs text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
        Your PDF is encrypted with AES-256 right here in your browser. The file and password never leave your device.
      </p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleProtect} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Protecting…' : 'Protect PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="protected.pdf" label="PDF protected successfully!" />}
    </div>
  )
}
