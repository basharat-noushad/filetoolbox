'use client'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { convertImageFormat } from '@/lib/tools/image/convert'
import {
  detectBackground, jpgToTransparentPng, loadImageData, makeTransparent, type RGB,
} from '@/lib/tools/image/transparentBg'
import JSZip from 'jszip'

const CHECKER = {
  backgroundColor: '#fff',
  backgroundImage:
    'linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%),linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 8px 8px',
}
const hex = (c: RGB) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')

export function JpgToPngClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [transparent, setTransparent] = useState(false)
  const [tolerance, setTolerance] = useState(20)
  const [removeAll, setRemoveAll] = useState(false)
  const [picked, setPicked] = useState<RGB | null>(null)
  const [preview, setPreview] = useState<ImageData | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const first = files[0]

  // low-res copy of the first file for the live preview
  useEffect(() => {
    let live = true
    setPreview(null)
    if (first && transparent) {
      loadImageData(first, 640).then(d => { if (live) setPreview(d) }).catch(() => { if (live) setError('Could not read this image for the preview.') })
    }
    return () => { live = false }
  }, [first, transparent])

  const autoBg = preview ? detectBackground(preview) : null
  const bg = picked ?? autoBg

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !preview || !bg) return
    const out = new ImageData(new Uint8ClampedArray(preview.data), preview.width, preview.height)
    makeTransparent(out, { bg, tolerance, removeAll })
    c.width = out.width; c.height = out.height
    c.getContext('2d')!.putImageData(out, 0, 0)
  }, [preview, bg, tolerance, removeAll])

  // any input change invalidates the previous result
  useEffect(() => { setResult(null) }, [files, transparent, tolerance, removeAll, picked])
  useEffect(() => { setPicked(null) }, [first])

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!preview) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.min(preview.width - 1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * preview.width)))
    const y = Math.min(preview.height - 1, Math.max(0, Math.floor((e.clientY - r.top) / r.height * preview.height)))
    const i = (y * preview.width + x) * 4
    setPicked([preview.data[i], preview.data[i + 1], preview.data[i + 2]])
  }

  const convertOne = (f: File) =>
    transparent
      ? jpgToTransparentPng(f, { bg: picked ?? undefined, tolerance, removeAll })
      : convertImageFormat(f, 'image/png')

  const handleConvert = async () => {
    if (files.length === 0) { setError('Please select at least one JPG image.'); return }
    setProcessing(true); setError(null)
    try {
      if (files.length === 1) {
        setResult(await convertOne(files[0]))
      } else {
        const zip = new JSZip()
        for (const f of files) {
          zip.file(f.name.replace(/\.(jpg|jpeg)$/i, '') + '.png', await convertOne(f))
        }
        setResult(await zip.generateAsync({ type: 'blob' }))
      }
    } catch {
      setError('Conversion failed. The image may be too large for your browser. Try a smaller file.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'] }} multiple maxFiles={20}
        onFilesSelected={f => { setFiles(f); setError(null) }}
        label="Drag & drop JPG images here"
        sublabel="Multiple files supported — lossless conversion"
      />

      <div className="mt-4 rounded-lg border border-gray-200 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)} className="mt-1 h-4 w-4 accent-brand-600" />
          <span>
            <span className="block text-sm font-medium text-gray-900">Make background transparent</span>
            <span className="block text-xs text-gray-500">Works best on logos, signatures and products on a plain, solid background. For photos of people or complex scenes use <a href="/remove-background" className="underline text-brand-700">Remove Background</a>.</span>
          </span>
        </label>

        {transparent && (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="tol" className="flex justify-between text-sm text-gray-700">
                <span>Tolerance</span><span className="tabular-nums text-gray-500">{tolerance}%</span>
              </label>
              <input id="tol" type="range" min={0} max={60} value={tolerance} onChange={e => setTolerance(+e.target.value)} className="w-full accent-brand-600" />
              <p className="text-xs text-gray-500">Higher removes more shades close to the background colour. Raise it if a halo or JPG noise is left behind.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={removeAll} onChange={e => setRemoveAll(e.target.checked)} className="h-4 w-4 accent-brand-600" />
              Remove all matching colour, not just around the edges (e.g. inside letters like O)
            </label>

            {first && (
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mb-2">
                  <span>Background colour:</span>
                  {bg && <span className="inline-block h-5 w-5 rounded border border-gray-300" style={{ background: hex(bg) }} aria-hidden />}
                  <span className="font-mono text-xs">{bg ? hex(bg) : '…'}</span>
                  <span className="text-gray-500">{picked ? '(picked, applied to all files)' : '(auto-detected per file)'}</span>
                  {picked && <button type="button" onClick={() => setPicked(null)} className="text-xs underline text-brand-700 cursor-pointer">Reset to auto</button>}
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden flex justify-center" style={CHECKER}>
                  {preview
                    ? <canvas ref={canvasRef} onClick={pick} className="max-w-full max-h-80 h-auto cursor-crosshair" aria-label="Preview — click to pick the background colour" />
                    : <div className="h-40 flex items-center text-sm text-gray-500">Loading preview…</div>}
                </div>
                <p className="mt-1 text-xs text-gray-500">Preview of {first.name}. Click the preview to pick the background colour. The download keeps full resolution.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : `Convert ${files.length > 0 ? files.length + ' file' + (files.length > 1 ? 's' : '') : ''} to PNG`}
      </Button>
      {result && <ToolResult blob={result} filename={files.length > 1 ? 'converted.zip' : `${files[0]?.name.replace(/\.(jpg|jpeg)$/i, '')}.png`} label={transparent ? 'Converted to transparent PNG!' : 'Converted to PNG successfully!'} />}
    </div>
  )
}
