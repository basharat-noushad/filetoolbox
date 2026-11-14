'use client'
import { useEffect, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { buildFaviconZip, buildIco, LINK_SNIPPET, loadImage, renderSquare, type FitMode } from '@/lib/tools/image/favicon'

const PREVIEW_SIZES = [16, 32, 48, 180]

function Preview({ img, size, mode }: { img: HTMLImageElement; size: number; mode: FitMode }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.width = c.height = size
    c.getContext('2d')!.drawImage(renderSquare(img, size, mode), 0, 0)
  }, [img, size, mode])
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="p-2 rounded-lg border border-gray-200 bg-[conic-gradient(#e5e7eb_25%,#fff_0_50%,#e5e7eb_0_75%,#fff_0)] bg-[length:12px_12px]">
        <canvas ref={ref} width={size} height={size} style={{ width: size, height: size, imageRendering: size < 48 ? 'pixelated' : 'auto' }} />
      </div>
      <span className="text-xs text-gray-500">{size}px</span>
    </div>
  )
}

export function FaviconGeneratorClient() {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [mode, setMode] = useState<FitMode>('pad')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const onFiles = async (files: File[]) => {
    setError(null)
    if (!files[0]) { setImg(null); return }
    try { setImg(await loadImage(files[0])) } catch { setImg(null); setError('Could not read that image. Try a PNG, JPG, WebP or SVG file.') }
  }

  const run = async (kind: 'zip' | 'ico') => {
    if (!img) return
    setBusy(true); setError(null)
    try {
      if (kind === 'zip') saveAs(await buildFaviconZip(img, mode), 'favicons.zip')
      else saveAs(await buildIco(img, mode), 'favicon.ico')
    } catch { setError('Could not create the icons. Please try another image.') } finally { setBusy(false) }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(LINK_SNIPPET); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { setError('Copy failed. Select the snippet and copy it manually.') }
  }

  const ratioOff = img && img.naturalWidth && img.naturalWidth !== img.naturalHeight

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-5">
      <FileDropzone
        accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'], 'image/svg+xml': ['.svg'] }}
        onFilesSelected={onFiles}
        label="Drag & drop your logo here"
        sublabel="PNG, JPG, WebP or SVG - a square image of 512 px or more works best"
      />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      {img && (<>
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">Non-square images</legend>
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="fit" checked={mode === 'pad'} onChange={() => setMode('pad')} /> Pad with transparency</label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="fit" checked={mode === 'crop'} onChange={() => setMode('crop')} /> Crop to square</label>
          </div>
          {ratioOff && <p className="text-xs text-gray-500 mt-1">This image is not square, so this choice changes the result.</p>}
        </fieldset>

        <div className="flex flex-wrap items-end gap-5">{PREVIEW_SIZES.map(s => <Preview key={s} img={img} size={s} mode={mode} />)}</div>

        <div className="grid sm:grid-cols-2 gap-2">
          <Button onClick={() => run('zip')} disabled={busy} size="lg" className="gap-2 cursor-pointer"><Download className="w-5 h-5" />{busy ? 'Creating…' : 'Download all (ZIP)'}</Button>
          <Button onClick={() => run('ico')} disabled={busy} size="lg" variant="outline" className="gap-2 cursor-pointer"><Download className="w-5 h-5" />ICO only</Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">HTML for your page head</span>
            <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-1.5 cursor-pointer">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-800">{LINK_SNIPPET}</pre>
          <p className="text-xs text-gray-500 mt-1">Upload the files to your site root. Edit the name and colours in site.webmanifest.</p>
        </div>
      </>)}
    </div>
  )
}
