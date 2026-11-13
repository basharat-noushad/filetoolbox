'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { compressImage } from '@/lib/tools/image/compress'
import { compressToTargetSize, type TargetMime } from '@/lib/tools/image/targetSize'

type Mode = 'quality' | 'target'
interface Outcome { blob: Blob; ext: string; note: string | null; warn: boolean; dims: string | null }

const PRESETS = [
  { label: '20 KB', kb: 20 }, { label: '50 KB', kb: 50 }, { label: '100 KB', kb: 100 },
  { label: '200 KB', kb: 200 }, { label: '500 KB', kb: 500 }, { label: '1 MB', kb: 1024 },
]
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`

export function CompressImageClient() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>('quality')
  const [quality, setQuality] = useState(80)
  const [targetKb, setTargetKb] = useState('100')
  const [pngFormat, setPngFormat] = useState<TargetMime>('image/jpeg')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setOutcome(null); setError(null) }
  const isPng = file?.type === 'image/png'
  const targetNum = Number(targetKb)

  const handleCompress = async () => {
    if (!file) { setError('Please select an image first.'); return }
    if (mode === 'target' && !(targetNum >= 1)) { setError('Enter a target size of at least 1 KB.'); return }
    setProcessing(true); setError(null)
    try {
      if (mode === 'quality') {
        const blob = await compressImage(file, { quality: quality / 100, maxSizeMB: 10 })
        setOutcome({ blob, ext: file.name.split('.').pop()?.toLowerCase() || 'jpg', note: null, warn: false, dims: null })
      } else {
        const outMime: TargetMime = isPng ? pngFormat : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
        const r = await compressToTargetSize(file, Math.round(targetNum * 1000) /* decimal KB: passes both 1000- and 1024-based upload limits */, outMime)
        const ext = r.unchanged ? (file.name.split('.').pop()?.toLowerCase() || EXT[file.type] || 'jpg') : EXT[r.mimeType]
        let note: string | null = null
        if (r.unchanged) note = `Your image is already ${kb(file.size)}, which is under ${targetNum} KB, so it was left unchanged.`
        else if (!r.reached) note = `Could not reach ${targetNum} KB. This is the smallest we could make it: ${kb(r.blob.size)}. Try a larger target.`
        setOutcome({
          blob: r.blob, ext, note, warn: !r.reached,
          dims: !r.downscaled ? null : `${r.width} × ${r.height} px`,
        })
      }
    } catch {
      setError('Compression failed. Please try a different image.')
    } finally {
      setProcessing(false)
    }
  }

  const result = outcome?.blob ?? null
  const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'
  const tab = (m: Mode) =>
    `flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={f => { setFile(f[0] || null); reset() }}
        label="Drag & drop your image here"
        sublabel="Supports JPG, PNG, WebP"
      />

      <div role="group" aria-label="Compression mode" className="mt-4 flex gap-1 p-1 bg-gray-100 rounded-lg">
        <button type="button" aria-pressed={mode === 'quality'} onClick={() => { setMode('quality'); reset() }} className={tab('quality')}>By quality</button>
        <button type="button" aria-pressed={mode === 'target'} onClick={() => { setMode('target'); reset() }} className={tab('target')}>To target size</button>
      </div>

      {file && (
        <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          Original size: <strong>{kb(file.size)}</strong>
          {result && <> → Compressed: <strong className={outcome?.warn ? 'text-amber-700' : 'text-green-600'}>{kb(result.size)}</strong>
            {result.size < file.size && <span className="ml-2 text-green-600">({Math.round((1 - result.size / file.size) * 100)}% saved)</span>}
            {outcome?.dims && <span className="ml-2 text-gray-500">resized to {outcome.dims}</span>}</>}
        </div>
      )}

      {mode === 'quality' ? (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="quality" className="text-sm font-medium text-gray-700">Quality: {quality}%</label>
            <span className="text-xs text-gray-500">{quality < 50 ? 'Aggressive' : quality < 75 ? 'Balanced' : 'High Quality'}</span>
          </div>
          <input id="quality" type="range" min={10} max={100} value={quality} onChange={e => { setQuality(Number(e.target.value)); reset() }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Smaller file</span><span>Better quality</span></div>
        </div>
      ) : (
        <div className="mt-4">
          <label htmlFor="target-kb" className="block text-sm font-medium text-gray-700 mb-1">Target file size (KB)</label>
          <input id="target-kb" type="number" inputMode="numeric" min={1} value={targetKb}
            onChange={e => { setTargetKb(e.target.value); reset() }} placeholder="e.g. 100" className={input} />
          <div role="group" aria-label="Target size presets" className="flex flex-wrap gap-2 mt-3">
            {PRESETS.map(p => (
              <button key={p.kb} type="button" aria-pressed={targetNum === p.kb} onClick={() => { setTargetKb(String(p.kb)); reset() }}
                className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-all cursor-pointer ${targetNum === p.kb ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {isPng && (
            <div className="mt-4">
              <label htmlFor="png-format" className="block text-sm font-medium text-gray-700 mb-1">Output format</label>
              <select id="png-format" value={pngFormat} onChange={e => { setPngFormat(e.target.value as TargetMime); reset() }} className={input}>
                <option value="image/jpeg">JPG (white background)</option>
                <option value="image/webp">WebP (keeps transparency)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">PNG is lossless, so it has to change format to reach a target size.</p>
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      {outcome?.note && (
        <p role="status" className={`mt-3 text-sm rounded-lg px-4 py-2 border ${outcome.warn ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>{outcome.note}</p>
      )}
      <Button onClick={handleCompress} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Compressing…' : mode === 'target' ? `Compress to ${targetNum >= 1 ? `${targetNum} KB` : 'target size'}` : 'Compress Image'}
      </Button>
      {result && outcome && <ToolResult blob={result} filename={`compressed.${outcome.ext}`} label="Image compressed successfully!" />}
    </div>
  )
}
