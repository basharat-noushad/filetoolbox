'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { PRESETS, MAX_EDGE, vectorizeImage, type VectorPreset } from '@/lib/tools/image/vectorize'

type Mode = 'trace' | 'embed'
interface Out { blob: Blob; url: string; name: string; paths?: number; downscaled?: boolean }

const MODES: { id: Mode; label: string }[] = [
  { id: 'trace', label: 'Trace to vector (real paths)' },
  { id: 'embed', label: 'Embed PNG in SVG' },
]

const choice = (on: boolean) =>
  `text-left rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:border-brand-400'}`

async function embedImage(file: File): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = e => resolve(e.target?.result as string)
    r.onerror = () => reject(new Error('read'))
    r.readAsDataURL(file)
  })
  const img = new Image()
  img.src = base64
  await img.decode()
  const { naturalWidth: w, naturalHeight: h } = img
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image href="${base64}" width="${w}" height="${h}"/></svg>`
}

export function PngToSvgClient() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<Mode>('trace')
  const [preset, setPreset] = useState<VectorPreset>('logo')
  const [out, setOut] = useState<Out | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // revoke the preview URL whenever it is replaced or on unmount
  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url) }, [out])
  // a stale result must not survive a different input or setting
  useEffect(() => { setOut(null); setError(null) }, [files, mode, preset])

  const handle = async () => {
    const file = files[0]
    if (!file) { setError('Please select an image file.'); return }
    setProcessing(true); setError(null)
    try {
      let svg: string, paths: number | undefined, downscaled: boolean | undefined
      if (mode === 'trace') {
        const r = await vectorizeImage(file, preset)
        svg = r.svg; paths = r.pathCount; downscaled = r.downscaled
      } else {
        svg = await embedImage(file)
      }
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      setOut({ blob, url: URL.createObjectURL(blob), name: file.name.replace(/\.[^.]+$/, '') + '.svg', paths, downscaled })
    } catch {
      setError('Conversion failed. Please check your file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Mode</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODES.map(m => (
            <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} className={choice(mode === m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === 'trace' ? (
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">Preset</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(PRESETS) as VectorPreset[]).map(p => (
              <button key={p} type="button" aria-pressed={preset === p} onClick={() => setPreset(p)} className={choice(preset === p)}>
                <span className="block font-medium">{PRESETS[p].label}</span>
                <span className="block text-xs text-gray-500">{PRESETS[p].hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
          This wraps your image inside an SVG file. It does not create vector paths. Use Trace mode for that.
        </div>
      )}

      <FileDropzone
        accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] }}
        onFilesSelected={setFiles}
        label="Drag & drop your PNG, JPG or WebP here"
        sublabel="or click to browse — max 50MB"
      />
      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? (mode === 'trace' ? 'Tracing…' : 'Converting…') : mode === 'trace' ? 'Convert to vector SVG' : 'Embed in SVG'}
      </Button>

      {out && (
        <>
          <div className="border border-gray-200 rounded-xl p-3 bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
            {/* blob URL in <img>: SVG scripts never run and markup is never injected */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={out.url} alt="SVG preview" className="mx-auto max-h-80 max-w-full" />
          </div>
          {out.paths !== undefined && (
            <p className="text-sm text-gray-600">{out.paths.toLocaleString()} vector paths · {(out.blob.size / 1024).toFixed(1)} KB</p>
          )}
          {out.downscaled && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2">
              Large image: it was reduced to {MAX_EDGE}px on its longest side before tracing. The SVG still scales to the original size.
            </p>
          )}
          <ToolResult blob={out.blob} filename={out.name} label={out.paths !== undefined ? 'Image traced to vector SVG!' : 'Image wrapped in SVG!'} />
        </>
      )}
    </div>
  )
}
