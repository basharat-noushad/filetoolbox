'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import {
  SplitError, SplitPart, packParts, splitByRanges, splitBySize, splitEveryN,
} from '@/lib/tools/pdf/split'

type Mode = 'ranges' | 'every' | 'size'
const MODES: { id: Mode; label: string }[] = [
  { id: 'ranges', label: 'By page ranges' },
  { id: 'every', label: 'Every N pages' },
  { id: 'size', label: 'By file size' },
]
const SIZE_PRESETS = [2, 5, 10, 20]

function parseRanges(input: string): [number, number][] | null {
  const parts = input.split(',').map(s => s.trim()).filter(Boolean)
  const ranges: [number, number][] = []
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      if (isNaN(a) || isNaN(b) || a < 1 || b < a) return null
      ranges.push([a, b])
    } else {
      const n = Number(part)
      if (isNaN(n) || n < 1) return null
      ranges.push([n, n])
    }
  }
  return ranges.length > 0 ? ranges : null
}

const fmtSize = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(2)} MB` : `${(b / 1000).toFixed(0)} KB`)
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'

export function SplitPdfClient() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>('ranges')
  const [rangeInput, setRangeInput] = useState('')
  const [everyN, setEveryN] = useState('1')
  const [maxMb, setMaxMb] = useState('5')
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null)
  const [parts, setParts] = useState<SplitPart[]>([])
  const [progress, setProgress] = useState<[number, number] | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [encrypted, setEncrypted] = useState(false)

  const reset = () => { setResult(null); setParts([]); setError(null); setEncrypted(false) }

  const ready =
    !!file && (mode === 'ranges' ? !!rangeInput.trim()
      : mode === 'every' ? Number(everyN) >= 1
        : Number(maxMb) > 0)

  const handleSplit = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    reset()
    const onProgress = (d: number, t: number) => setProgress([d, t])
    try {
      let out: SplitPart[]
      if (mode === 'ranges') {
        const ranges = parseRanges(rangeInput)
        if (!ranges) { setError('Invalid page ranges. Use format like "1-3, 5, 7-9".'); return }
        setProcessing(true); setProgress([0, 1])
        out = await splitByRanges(file, ranges, onProgress)
      } else if (mode === 'every') {
        const n = Math.floor(Number(everyN))
        if (!(n >= 1)) { setError('Enter a number of pages of 1 or more.'); return }
        setProcessing(true); setProgress([0, 1])
        out = await splitEveryN(file, n, onProgress)
      } else {
        const mb = Number(maxMb)
        if (!(mb > 0)) { setError('Enter a maximum size in MB greater than 0.'); return }
        setProcessing(true); setProgress([0, 1])
        out = await splitBySize(file, Math.floor(mb * 1_000_000), onProgress)
      }
      setParts(out)
      setResult(await packParts(out))
    } catch (e) {
      if (e instanceof SplitError) {
        setError(e.message); setEncrypted(e.code === 'encrypted')
      } else {
        setError('Split failed. Please check your settings and try again.')
      }
    } finally {
      setProcessing(false); setProgress(null)
    }
  }

  const oversized = parts.filter(p => p.oversized)
  const pct = progress ? Math.round((progress[0] / Math.max(1, progress[1])) * 100) : 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => { setFile(f[0] || null); reset() }}
        label="Drag & drop your PDF here"
      />

      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Split mode">
        {MODES.map(m => (
          <button
            key={m.id} type="button" role="radio" aria-checked={mode === m.id}
            onClick={() => { setMode(m.id); reset() }}
            className={`px-3 py-1.5 text-sm rounded-lg border cursor-pointer transition-colors ${
              mode === m.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'
            }`}
          >{m.label}</button>
        ))}
      </div>

      <div className="mt-4">
        {mode === 'ranges' && (
          <>
            <label htmlFor="split-ranges" className="block text-sm font-medium text-gray-700 mb-1">Page Ranges</label>
            <input id="split-ranges" type="text" value={rangeInput} onChange={e => { setRangeInput(e.target.value); reset() }}
              placeholder="e.g. 1-3, 5, 7-9" className={inputCls} />
            <p className="text-xs text-gray-500 mt-1">Each range becomes a separate PDF part</p>
          </>
        )}
        {mode === 'every' && (
          <>
            <label htmlFor="split-every" className="block text-sm font-medium text-gray-700 mb-1">Pages per part</label>
            <input id="split-every" type="number" min={1} step={1} value={everyN} onChange={e => { setEveryN(e.target.value); reset() }}
              className={inputCls} />
            <p className="text-xs text-gray-500 mt-1">Use 1 to save every page as its own PDF</p>
          </>
        )}
        {mode === 'size' && (
          <>
            <span className="block text-sm font-medium text-gray-700 mb-1">Maximum size per part</span>
            <div className="flex flex-wrap items-center gap-2">
              {SIZE_PRESETS.map(mb => (
                <button key={mb} type="button" onClick={() => { setMaxMb(String(mb)); reset() }}
                  className={`px-3 py-1.5 text-sm rounded-lg border cursor-pointer ${
                    Number(maxMb) === mb ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-300 text-gray-700 hover:border-brand-400'
                  }`}>{mb} MB</button>
              ))}
              <div className="flex items-center gap-1">
                <input aria-label="Custom size in MB" type="number" min={0.1} step={0.1} value={maxMb}
                  onChange={e => { setMaxMb(e.target.value); reset() }}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <span className="text-sm text-gray-600">MB</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">1 MB = 1,000,000 bytes. Pages stay in order; each part stays under the limit.</p>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}{encrypted && <> <a href="/unlock-pdf" className="underline font-medium">Open Unlock PDF</a></>}
        </p>
      )}

      <Button onClick={handleSplit} disabled={!ready || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? `Splitting… ${pct}%` : 'Split PDF'}
      </Button>
      {processing && (
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      {oversized.length > 0 && (
        <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          {oversized.length === 1 ? 'Page' : 'Pages'} {oversized.map(p => p.from).join(', ')} {oversized.length === 1 ? 'is' : 'are'} larger than {maxMb} MB on {oversized.length === 1 ? 'its' : 'their'} own, so {oversized.length === 1 ? 'it was' : 'they were'} saved as separate part{oversized.length === 1 ? '' : 's'} that exceed{oversized.length === 1 ? 's' : ''} the limit.
        </p>
      )}

      {result && parts.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 border border-gray-200 rounded-lg text-sm max-h-64 overflow-auto" aria-label="Output parts">
          {parts.map(p => (
            <li key={p.name} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="truncate text-gray-700">{p.name} <span className="text-gray-500">— {p.from === p.to ? `page ${p.from}` : `pages ${p.from}–${p.to}`}</span></span>
              <span className={`flex-shrink-0 ${p.oversized ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>{fmtSize(p.bytes.length)}</span>
            </li>
          ))}
        </ul>
      )}
      {result && <ToolResult blob={result.blob} filename={result.filename} label={`PDF split into ${parts.length} part${parts.length === 1 ? '' : 's'}!`} />}
    </div>
  )
}
