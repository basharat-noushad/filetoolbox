'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { saveAs } from 'file-saver'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { pdfToText, joinPages, PdfTextError } from '@/lib/tools/pdf/pdfToText'

export function PdfToTextClient() {
  const [files, setFiles] = useState<File[]>([])
  const [pages, setPages] = useState<string[] | null>(null)
  const [chars, setChars] = useState(0)
  const [separators, setSeparators] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<{ msg: string; link?: [string, string] } | null>(null)
  const [copied, setCopied] = useState(false)

  const text = useMemo(() => (pages ? joinPages(pages, separators) : ''), [pages, separators])
  // under ~10 characters per page: almost certainly a scan or photo, not real text
  const scanned = pages !== null && chars < pages.length * 10

  const handleExtract = async () => {
    if (processing) return
    if (files.length === 0) { setError({ msg: 'Please select a PDF file.' }); return }
    setProcessing(true); setError(null); setPages(null)
    try {
      const r = await pdfToText(files[0])
      setPages(r.pages); setChars(r.chars)
    } catch (e) {
      if (e instanceof PdfTextError && e.code === 'encrypted') setError({ msg: 'This PDF is password-protected, so the text cannot be read. Remove the password first with', link: ['/unlock-pdf', 'Unlock PDF'] })
      else setError({ msg: 'Could not read this PDF. It may be damaged or not a real PDF file.' })
    } finally {
      setProcessing(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError({ msg: 'Copy was blocked by the browser. Select the text and copy it manually.' })
    }
  }

  const base = files[0]?.name.replace(/\.pdf$/i, '') || 'extracted-text'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => { setFiles(f); setPages(null); setError(null) }}
        label="Drag & drop your PDF here"
        sublabel="Text is read in your browser — max 50MB"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error.msg}{error.link && <> <Link href={error.link[0]} className="underline font-medium">{error.link[1]}</Link>.</>}
        </p>
      )}
      <Button onClick={handleExtract} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Extracting Text…' : 'Extract Text'}
      </Button>
      {pages !== null && scanned && (
        <p role="status" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Almost no text was found. This PDF is probably a scan or a photo of a document. Use <Link href="/ocr-pdf" className="underline font-medium">OCR PDF</Link> to read the text from the page images.
        </p>
      )}
      {pages !== null && !scanned && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={separators} onChange={e => setSeparators(e.target.checked)} className="size-4 accent-brand-600" />
              Add page separators
            </label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="cursor-pointer">{copied ? 'Copied!' : 'Copy Text'}</Button>
              <Button variant="outline" size="sm" onClick={() => saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${base}.txt`)} className="cursor-pointer">Download .txt</Button>
            </div>
          </div>
          <textarea
            readOnly
            aria-label="Extracted text"
            value={text}
            className="w-full h-72 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 font-mono resize-y"
          />
          <p className="text-xs text-gray-500">{pages.length} page{pages.length === 1 ? '' : 's'}, {chars.toLocaleString()} characters.</p>
        </div>
      )}
    </div>
  )
}
