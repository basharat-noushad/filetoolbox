'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { saveAs } from 'file-saver'

export function OcrPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState('eng')
  const [copied, setCopied] = useState(false)

  const handleOcr = async () => {
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    setProcessing(true); setError(null); setExtractedText(null)
    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      const pdf = await pdfjs.getDocument({ data: await files[0].arrayBuffer() }).promise
      const Tesseract = await import('tesseract.js')
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport, canvas }).promise
        const result = await Tesseract.recognize(canvas, lang)
        fullText += `--- Page ${i} ---\n${result.data.text}\n\n`
      }
      setExtractedText(fullText)
    } catch {
      setError('OCR failed. Please check your PDF and try again.')
    } finally {
      setProcessing(false)
    }
  }

  const handleCopy = () => {
    if (!extractedText) return
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!extractedText) return
    saveAs(new Blob([extractedText], { type: 'text/plain' }), 'extracted-text.txt')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your PDF here"
        sublabel="Works best with scanned PDFs — max 50MB"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="eng">English</option>
          <option value="spa">Spanish</option>
          <option value="fra">French</option>
          <option value="deu">German</option>
          <option value="chi_sim">Chinese (Simplified)</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleOcr} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Extracting Text…' : 'Extract Text with OCR'}
      </Button>
      {extractedText !== null && (
        <div className="space-y-3">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleCopy} className="cursor-pointer">
              {copied ? 'Copied!' : 'Copy Text'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="cursor-pointer">
              Download .txt
            </Button>
          </div>
          <textarea
            readOnly
            value={extractedText}
            className="w-full h-64 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 font-mono resize-y"
          />
        </div>
      )}
    </div>
  )
}
