'use client'
import { useEffect, useState } from 'react'
import { saveAs } from 'file-saver'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { OCR_LANGUAGES } from '@/lib/tools/ocrLanguages'
import { imageToText } from '@/lib/tools/image/imageToText'

export function ImageToTextClient() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [lang, setLang] = useState('eng')
  const [text, setText] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ pct: number; status: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const choose = (f: File | null) => { setImage(f); setText(null); setError(null) }

  useEffect(() => {
    if (!image) { setPreview(null); return }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  // Ctrl+V of a copied image / screenshot anywhere on the page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.kind === 'file' && i.type.startsWith('image/'))
      const f = item?.getAsFile()
      if (!f) return
      e.preventDefault()
      choose(new File([f], `pasted-image.${f.type.split('/')[1] || 'png'}`, { type: f.type }))
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  const handleExtract = async () => {
    if (processing) return
    if (!image) { setError('Please add an image first.'); return }
    setProcessing(true); setError(null); setText(null); setProgress({ pct: 0, status: 'starting' })
    try {
      setText(await imageToText(image, lang, (pct, status) => setProgress({ pct, status })))
    } catch {
      setError('Text recognition failed. Check the image, and your connection if you picked a language other than English, then try again.')
    } finally {
      setProcessing(false); setProgress(null)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy was blocked by the browser. Select the text and copy it manually.')
    }
  }

  const base = image?.name.replace(/\.[^.]+$/, '') || 'extracted-text'
  const label = progress ? (progress.status.includes('recogniz') ? 'Reading text' : progress.status.includes('load') || progress.status.includes('initial') ? 'Loading OCR engine' : 'Working') : ''

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={f => choose(f[0] ?? null)}
        label="Drag & drop an image here"
        sublabel="JPG, PNG or WebP — or press Ctrl+V to paste a screenshot"
      />
      {image && preview && (
        <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected image preview" className="h-16 w-16 object-contain bg-gray-50 rounded" />
          <span className="text-sm text-gray-700 truncate">{image.name}</span>
        </div>
      )}
      <div>
        <label htmlFor="ocr-lang" className="block text-sm font-medium text-gray-700 mb-1">Language of the text</label>
        <select
          id="ocr-lang"
          value={lang}
          onChange={e => { setLang(e.target.value); setText(null) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {OCR_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        {lang !== 'eng' && <p className="text-xs text-gray-500 mt-1">This language&apos;s data file is downloaded once the first time you use it. Your image is not uploaded.</p>}
      </div>
      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleExtract} disabled={!image || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Extracting Text…' : 'Extract Text'}
      </Button>
      {progress && (
        <div role="status" aria-live="polite">
          <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{label}</span><span>{progress.pct}%</span></div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-brand-600 transition-[width]" style={{ width: `${progress.pct}%` }} /></div>
        </div>
      )}
      {text !== null && (
        text.trim() === '' ? (
          <p role="status" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            No text was found. Try a sharper, higher-contrast image, make sure the language matches, and note that handwriting is not reliably recognised.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCopy} className="cursor-pointer">{copied ? 'Copied!' : 'Copy Text'}</Button>
              <Button variant="outline" size="sm" onClick={() => saveAs(new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' }), `${base}.txt`)} className="cursor-pointer">Download .txt</Button>
            </div>
            <textarea
              aria-label="Extracted text"
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full h-64 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 font-mono resize-y"
            />
            <p className="text-xs text-gray-500">Works best on clear printed text. Please proofread — you can edit the result above.</p>
          </div>
        )
      )}
    </div>
  )
}
