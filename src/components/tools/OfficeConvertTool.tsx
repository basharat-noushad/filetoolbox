'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import {
  convertInBrowser, convertOnline, looksScanned, isFinal, DocConvertError, ONLINE_MAX_BYTES, type ConvertTarget,
} from '@/lib/tools/pdf/docConvert'
import type { OcrImage, OcrSession } from '@/lib/tools/pdf/ocr'
import { OCR_LANGUAGES } from '@/lib/tools/ocrLanguages'

interface OfficeConvertToolProps {
  /** output format */
  to: ConvertTarget
  /** Adobe-backed API route used as the fallback, e.g. '/api/pdf-to-word' */
  onlineEndpoint: string
  accept: Record<string, string[]>
  label: string
  sublabel: string
  buttonLabel: string
  successLabel: string
  emptyError: string
}

type Phase = null | 'browser' | 'online'
type Result = { blob: Blob; filename: string; engine: 'browser' | 'online'; note?: string }

const MAX_BYTES = 100 * 1024 * 1024
const message = (e: unknown) => (e instanceof Error && e.message) || 'An unexpected error occurred.'
const code = (e: unknown) => (e instanceof DocConvertError ? e.code : 'failed')

/**
 * Shared UI for the six Office <-> PDF tools. The file is converted in the visitor's browser first; for
 * PDF input, scanned pages are read there too (Tesseract, see ocr.ts). The online converter (Adobe PDF
 * Services, via our API route) is the fallback: automatically when the browser can't convert the file or
 * scanned pages remain that it could not read, and on request afterwards.
 */
export function OfficeConvertTool({ to, onlineEndpoint, accept, label, sublabel, buttonLabel, successLabel, emptyError }: OfficeConvertToolProps) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [phase, setPhase] = useState<Phase>(null)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState('eng')
  const [progress, setProgress] = useState<{ page: number; pages: number } | null>(null)
  const abort = useRef<AbortController | null>(null)
  const fromPdf = to !== 'pdf'

  useEffect(() => () => abort.current?.abort(), [])

  const outName = (f: File) => `${f.name.replace(/\.[^.]+$/, '') || 'converted'}.${to}`
  const fitsOnline = (f: File) => f.size <= ONLINE_MAX_BYTES

  const run = async (f: File, onlineOnly: boolean) => {
    const ac = new AbortController()
    abort.current = ac
    setError(null)
    try {
      let local: Result | null = null
      if (!onlineOnly) {
        setPhase('browser')
        // one Tesseract worker for this conversion, loaded (with ocr.ts) only when a scanned page needs reading
        let session = null as Promise<OcrSession> | null
        const ocr = (image: OcrImage) => (session ||= import('@/lib/tools/pdf/ocr').then((m) => m.createOcrSession(lang))).then((s) => s.ocr(image))
        try {
          const r = await convertInBrowser(f, to, {
            signal: ac.signal,
            ocr: fromPdf ? ocr : undefined,
            onProgress: (p) => { if (abort.current === ac) setProgress({ page: p.page, pages: p.pages }) },
          })
          local = { blob: r.blob, filename: outName(f), engine: 'browser' }
          if (!looksScanned(r)) { setResult(local); return }
          // Scanned pages the browser could not read stay pictures. The online converter may read them.
          local.note = 'Some pages look scanned and could not be read, so they were kept as pictures and their text is not editable.'
          if (!fitsOnline(f)) { setResult(local); return }
        } catch (e) {
          if (code(e) === 'cancelled') return
          if (isFinal(code(e))) { setError(message(e)); return }
          if (!fitsOnline(f)) { setError(message(e)); return }
          // otherwise fall through to the online converter
        } finally {
          void session?.then((s) => s.end())
          setProgress(null)
        }
      }
      setPhase('online')
      try {
        const blob = await convertOnline(f, onlineEndpoint, ac.signal)
        setResult({ blob, filename: outName(f), engine: 'online' })
      } catch (e) {
        if (code(e) === 'cancelled') return
        if (local) setResult(local) // keep the browser result; the online converter was only an upgrade
        else if (result && onlineOnly) setError(`The online converter could not convert this file: ${message(e)}`)
        else setError(message(e))
      }
    } finally {
      if (abort.current === ac) abort.current = null
      setPhase(null)
      setProgress(null)
    }
  }

  const handleConvert = () => {
    if (!file) { setError(emptyError); return }
    setResult(null)
    void run(file, false)
  }

  const busy = phase !== null
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone maxSize={MAX_BYTES}
        accept={accept}
        onFilesSelected={f => { abort.current?.abort(); setFile(f[0] || null); setResult(null); setError(null) }}
        label={label}
        sublabel={sublabel}
        privacyNote={to === 'pdf'
          ? "Converted in your browser. Only files your browser can't convert are sent to our online converter."
          : "Converted in your browser, scanned pages included. A file is sent to our online converter only if your browser can't convert it or can't read a scan."}
      />
      {fromPdf && (
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="scan-lang" className="text-sm text-gray-700">Language of scanned pages</label>
          <select id="scan-lang" value={lang} onChange={e => setLang(e.target.value)} disabled={busy}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {OCR_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <div className="mt-4 flex gap-3">
        <Button onClick={handleConvert} disabled={!file || busy} className="flex-1 cursor-pointer" size="lg">
          {phase === 'browser'
            ? (progress ? `Reading scanned pages… ${progress.page} of ${progress.pages}` : 'Converting in your browser…')
            : phase === 'online' ? 'Converting online…' : buttonLabel}
        </Button>
        {busy && (
          <Button onClick={() => abort.current?.abort()} variant="outline" size="lg" className="cursor-pointer">Cancel</Button>
        )}
      </div>
      {phase === 'online' && (
        <p className="mt-2 text-xs text-gray-500">The file is being sent to our online converter.</p>
      )}
      {result && (
        <>
          <ToolResult blob={result.blob} filename={result.filename} label={successLabel} />
          {result.note && <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">{result.note}</p>}
          {result.engine === 'browser' && file && fitsOnline(file) && !busy && (
            <p className="mt-3 text-sm text-gray-600">
              Layout not quite right?{' '}
              <button type="button" onClick={() => void run(file, true)} className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700 cursor-pointer">
                Try the online converter
              </button>
              . It uploads your file for processing.
            </p>
          )}
        </>
      )}
    </div>
  )
}
