'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { txtToPdf } from '@/lib/tools/pdf/txtToPdf'

const MARGINS = { narrow: 36, normal: 54, wide: 72 } as const
const selectCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

export function TxtToPdfClient() {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('document')
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4')
  const [fontSize, setFontSize] = useState(12)
  const [margin, setMargin] = useState<keyof typeof MARGINS>('normal')
  const [result, setResult] = useState<{ blob: Blob; pages: number } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setResult(null); setNotice(null); setError(null) }

  const onFile = async (files: File[]) => {
    reset()
    if (!files[0]) return
    try {
      setText(await files[0].text())
      setFileName(files[0].name.replace(/\.[^.]+$/, '') || 'document')
    } catch {
      setError('Could not read that file as text.')
    }
  }

  const handleConvert = async () => {
    if (processing) return
    if (!text.trim()) { setError('Upload a .txt file or type/paste some text first.'); return }
    setProcessing(true); reset()
    try {
      const r = await txtToPdf(text, { pageSize, fontSize, margin: MARGINS[margin] })
      setResult({ blob: r.blob, pages: r.pages })
      if (r.replaced.length) {
        setNotice(`${r.replaced.length} character${r.replaced.length === 1 ? '' : 's'} are not in the supported fonts and were replaced with "?": ${r.replaced.slice(0, 12).join(' ')}${r.replaced.length > 12 ? ' …' : ''}`)
      }
    } catch {
      setError('Could not create the PDF. Please try again with different text.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'text/plain': ['.txt'] }}
        onFilesSelected={onFile}
        label="Drag & drop a .txt file here"
        sublabel="or paste your text below — max 50MB"
      />
      <div>
        <label htmlFor="txt-input" className="block text-sm font-medium text-gray-700 mb-1">Text</label>
        <textarea
          id="txt-input"
          value={text}
          onChange={e => { setText(e.target.value); reset() }}
          placeholder="Paste or type your text here…"
          className="w-full h-48 border border-gray-300 rounded-lg p-3 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-sm font-medium text-gray-700">Page size
          <select value={pageSize} onChange={e => { setPageSize(e.target.value as 'a4' | 'letter'); reset() }} className={`${selectCls} mt-1 w-full`}>
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">Font size
          <select value={fontSize} onChange={e => { setFontSize(Number(e.target.value)); reset() }} className={`${selectCls} mt-1 w-full`}>
            {[10, 11, 12, 13, 14, 15, 16].map(n => <option key={n} value={n}>{n} pt</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">Margins
          <select value={margin} onChange={e => { setMargin(e.target.value as keyof typeof MARGINS); reset() }} className={`${selectCls} mt-1 w-full`}>
            <option value="narrow">Narrow (0.5 in)</option>
            <option value="normal">Normal (0.75 in)</option>
            <option value="wide">Wide (1 in)</option>
          </select>
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={!text.trim() || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : 'Convert to PDF'}
      </Button>
      {notice && <p role="status" className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 break-words">{notice}</p>}
      {result && <ToolResult blob={result.blob} filename={`${fileName}.pdf`} label={`PDF ready — ${result.pages} page${result.pages === 1 ? '' : 's'}`} />}
    </div>
  )
}
