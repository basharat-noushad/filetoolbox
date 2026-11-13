'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

type Mode = 'lossless' | 'target'
const PRESETS = [100, 200, 500, 1000, 2000]
const fmt = (kb: number) => (kb >= 1000 ? `${kb / 1000} MB` : `${kb} KB`)
const fmtBytes = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(0)} KB`)

const chip = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors ${
    active ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-700 hover:border-brand-400'
  }`

export function CompressPdfClient() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>('lossless')
  const [targetKb, setTargetKb] = useState(500)
  const [custom, setCustom] = useState('')
  const [result, setResult] = useState<{ blob: Blob; label: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setResult(null); setError(null) }

  const handleCompress = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    if (mode === 'target' && !(targetKb >= 20)) { setError('Enter a target size of at least 20 KB.'); return }
    setProcessing(true); reset(); setStatus('Starting…')
    try {
      if (mode === 'lossless') {
        const { compressPdf } = await import('@/lib/tools/pdf/compress')
        const blob = await compressPdf(file)
        setResult({
          blob,
          label: blob.size < file.size
            ? `Saved ${((file.size - blob.size) / 1024).toFixed(1)} KB (${Math.round((1 - blob.size / file.size) * 100)}%)`
            : 'No size reduction. Your original PDF is ready to download.',
        })
      } else {
        const { compressToSize } = await import('@/lib/tools/pdf/compressToSize')
        const r = await compressToSize(file, targetKb * 1000 /* decimal KB: safe for either upload-limit convention */, p =>
          setStatus(`Pass ${p.pass} · page ${p.page}/${p.pages}`))
        const target = fmt(targetKb)
        setResult({
          blob: r.blob,
          label: r.lossless
            ? `Already under ${target} (${fmtBytes(r.blob.size)}) with lossless optimization. Text is still selectable.`
            : r.reached
              ? `Compressed to ${fmtBytes(r.blob.size)}, under your ${target} target.`
              : `Could not reach ${target}. The smallest result is ${fmtBytes(r.blob.size)}. Try a larger target or split the PDF.`,
        })
      }
    } catch (e) {
      const msg = e instanceof Error ? `${e.name} ${e.message}` : ''
      setError(/password|encrypt/i.test(msg)
        ? 'This PDF is password-protected. Remove the password with the Unlock PDF tool first, then compress it.'
        : /invalid|corrupt|missing pdf/i.test(msg)
          ? 'This file does not look like a valid PDF. Please try a different file.'
          : 'Compression failed. Please try a different file.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => { setFile(f[0] || null); reset() }}
        label="Drag & drop your PDF here"
      />

      <fieldset className="mt-5" disabled={processing}>
        <legend className="text-sm font-medium text-gray-900 mb-2">Compression mode</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={mode === 'lossless'} className={chip(mode === 'lossless')}
            onClick={() => { setMode('lossless'); reset() }}>Lossless (keeps text)</button>
          <button type="button" aria-pressed={mode === 'target'} className={chip(mode === 'target')}
            onClick={() => { setMode('target'); reset() }}>Target size (strong)</button>
        </div>
      </fieldset>

      {mode === 'lossless' ? (
        <p className="mt-4 text-sm text-gray-600 leading-relaxed">
          Optimizes PDF structure without reducing image resolution. Savings vary;
          already optimized PDFs and scans may not get smaller. Maximum file size: 50 MB.
        </p>
      ) : (
        <div className="mt-4">
          <fieldset disabled={processing}>
            <legend className="text-sm font-medium text-gray-900 mb-2">Target size</legend>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map(kb => (
                <button key={kb} type="button" aria-pressed={targetKb === kb && !custom}
                  className={chip(targetKb === kb && !custom)}
                  onClick={() => { setTargetKb(kb); setCustom(''); reset() }}>{fmt(kb)}</button>
              ))}
              <label className="flex items-center gap-1.5 text-sm text-gray-700">
                <span className="sr-only">Custom target in KB</span>
                <input type="number" inputMode="numeric" min={20} placeholder="Custom"
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setTargetKb(Number(e.target.value) || 0); reset() }}
                  className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-600 focus:outline-none" />
                KB
              </label>
            </div>
          </fieldset>
          <p className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 leading-relaxed">
            Target size turns every page into an image. Text will not be selectable or searchable,
            and links and form fields are removed. Your original file is not changed.
          </p>
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleCompress} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? `Compressing… ${status}` : mode === 'target' ? `Compress to ${targetKb ? fmt(targetKb) : '…'}` : 'Compress PDF'}
      </Button>
      {result && <ToolResult blob={result.blob} filename="compressed.pdf" label={result.label} />}
    </div>
  )
}
