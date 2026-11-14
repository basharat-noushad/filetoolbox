'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import {
  APPLE_DEFAULT_FILL, applyRemoval, buildFaviconZip, buildIco, hasTransparency, imageToData, LINK_SNIPPET, loadImage, renderIcon, toSource,
  type FitMode, type IconOpts, type Shape,
} from '@/lib/tools/image/favicon'
import { detectBackground, type RGB } from '@/lib/tools/image/transparentBg'

const CHECKER = {
  backgroundColor: '#fff',
  backgroundImage:
    'linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%),linear-gradient(45deg,#d4d4d8 25%,transparent 25%,transparent 75%,#d4d4d8 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 8px 8px',
}
const hex = (c: RGB) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
const PREVIEW_MAX = 640
const EXPORT_MAX = 1024

function Icon({ src, size, o, shape, fill, scaled }: { src: HTMLCanvasElement; size: number; o: IconOpts; shape?: Shape; fill?: string | null; scaled?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    c.width = c.height = size
    c.getContext('2d')!.drawImage(renderIcon(src, size, o, shape, fill), 0, 0)
  }, [src, size, o, shape, fill])
  const d = scaled ?? size
  return <canvas ref={ref} width={size} height={size} style={{ width: d, height: d, imageRendering: size < 48 ? 'pixelated' : 'auto' }} />
}

function Panel({ dark, src, o }: { dark: boolean; src: HTMLCanvasElement; o: IconOpts }) {
  const icoShape: Shape = o.shapeIco ? o.shape : 'none'
  return (
    <div className={`rounded-lg border p-3 space-y-3 ${dark ? 'bg-zinc-900 border-zinc-700 text-zinc-300' : 'bg-white border-gray-200 text-gray-600'}`}>
      <p className="text-xs font-medium">{dark ? 'Dark browser / dark mode' : 'Light browser'}</p>
      <div className="flex items-end gap-4">
        {[16, 32, 48].map(s => (
          <div key={s} className="flex flex-col items-center gap-1">
            <Icon src={src} size={s} o={o} shape={icoShape} />
            <span className="text-[11px] opacity-70">{s}px</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className={`flex items-center gap-2 rounded-t-lg px-3 py-1.5 text-xs w-44 max-w-full ${dark ? 'bg-zinc-700 text-zinc-100' : 'bg-gray-100 text-gray-800'}`}>
          <Icon src={src} size={16} o={o} shape={icoShape} />
          <span className="truncate">My Site - Home</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="rounded-[18px] p-2" style={{ background: dark ? 'linear-gradient(135deg,#1e293b,#0f172a)' : 'linear-gradient(135deg,#93c5fd,#c4b5fd)' }}>
            <div className="overflow-hidden rounded-[22%]"><Icon src={src} size={180} o={o} shape="none" fill={o.fill ?? APPLE_DEFAULT_FILL} scaled={60} /></div>
          </div>
          <span className="text-[11px] opacity-70">iPhone home screen</span>
        </div>
      </div>
    </div>
  )
}

export function FaviconGeneratorClient() {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [mode, setMode] = useState<FitMode>('pad')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [alpha, setAlpha] = useState(false)
  const [remove, setRemove] = useState<boolean | null>(null) // null = not answered yet
  const [tolerance, setTolerance] = useState(20)
  const [removeAll, setRemoveAll] = useState(false)
  const [picked, setPicked] = useState<RGB | null>(null)
  const [trim, setTrim] = useState(false)
  const [padding, setPadding] = useState(0)
  const [shape, setShape] = useState<Shape>('none')
  const [shapeIco, setShapeIco] = useState(false)
  const [solid, setSolid] = useState(false)
  const [fillColor, setFillColor] = useState('#ffffff')
  const pickRef = useRef<HTMLCanvasElement>(null)

  const orig = useMemo(() => (img ? imageToData(img, PREVIEW_MAX) : null), [img])
  const removed = useMemo(
    () => (orig && remove ? applyRemoval(orig, { bg: picked, tolerance, removeAll }) : orig),
    [orig, remove, picked, tolerance, removeAll],
  )
  const src = useMemo(() => (removed ? toSource(removed, trim) : null), [removed, trim])
  const autoBg = useMemo(() => (orig && remove ? detectBackground(orig) : null), [orig, remove])
  const bgShown = picked ?? autoBg
  const o: IconOpts = useMemo(
    () => ({ mode, padding, shape, fill: solid ? fillColor : null, shapeIco }),
    [mode, padding, shape, solid, fillColor, shapeIco],
  )

  useEffect(() => {
    const c = pickRef.current
    if (!c || !removed || !remove) return
    c.width = removed.width; c.height = removed.height
    c.getContext('2d')!.putImageData(removed, 0, 0)
  }, [removed, remove])

  const onFiles = async (files: File[]) => {
    setError(null); setPicked(null)
    if (!files[0]) { setImg(null); return }
    try {
      const i = await loadImage(files[0])
      const has = hasTransparency(imageToData(i, 256))
      setAlpha(has); setRemove(has ? false : null); setImg(i)
    } catch { setImg(null); setError('Could not read that image. Try a PNG, JPG, WebP or SVG file.') }
  }

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!orig) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.min(orig.width - 1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * orig.width)))
    const y = Math.min(orig.height - 1, Math.max(0, Math.floor((e.clientY - r.top) / r.height * orig.height)))
    const i = (y * orig.width + x) * 4
    setPicked([orig.data[i], orig.data[i + 1], orig.data[i + 2]])
  }

  const run = async (kind: 'zip' | 'ico') => {
    if (!img) return
    setBusy(true); setError(null)
    try {
      const full = imageToData(img, EXPORT_MAX)
      const s = toSource(remove ? applyRemoval(full, { bg: picked, tolerance, removeAll }) : full, trim)
      if (kind === 'zip') saveAs(await buildFaviconZip(s, o), 'favicons.zip')
      else saveAs(await buildIco(s, o), 'favicon.ico')
    } catch { setError('Could not create the icons. Please try another image.') } finally { setBusy(false) }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(LINK_SNIPPET); setCopied(true); setTimeout(() => setCopied(false), 1500) }
    catch { setError('Copy failed. Select the snippet and copy it manually.') }
  }

  const ratioOff = img && img.naturalWidth && img.naturalWidth !== img.naturalHeight
  const choice = 'flex items-start gap-3 rounded-lg border p-3 cursor-pointer text-sm'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-5">
      <FileDropzone
        accept={{ 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'], 'image/svg+xml': ['.svg'] }}
        onFilesSelected={onFiles}
        label="Drag & drop your logo here"
        sublabel="PNG, JPG, WebP or SVG - a square image of 512 px or more works best"
      />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      {img && src && (<>
        <fieldset className="rounded-lg border border-gray-200 p-4 space-y-3">
          <legend className="px-1 text-sm font-semibold text-gray-900">Remove the background from your image?</legend>
          {alpha && <p className="text-xs text-green-700">Your image already has a transparent background.</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={`${choice} ${remove === false ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
              <input type="radio" name="rm" checked={remove === false} onChange={() => setRemove(false)} className="mt-1 accent-brand-600" />
              <span><span className="block font-medium text-gray-900">Keep as is</span><span className="block text-xs text-gray-500">Use the image exactly as uploaded.</span></span>
            </label>
            <label className={`${choice} ${remove ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
              <input type="radio" name="rm" checked={remove === true} onChange={() => setRemove(true)} className="mt-1 accent-brand-600" />
              <span><span className="block font-medium text-gray-900">Remove plain background</span><span className="block text-xs text-gray-500">Best for logos on white or a solid colour.</span></span>
            </label>
          </div>
          <p className="text-xs text-gray-500">Photo with a complex background? Use <a href="/remove-background" className="underline text-brand-700">Remove Background</a> first, then upload the PNG here.</p>

          {remove && (
            <div className="space-y-4 pt-1">
              <div>
                <label htmlFor="tol" className="flex justify-between text-sm text-gray-700"><span>Tolerance</span><span className="tabular-nums text-gray-500">{tolerance}%</span></label>
                <input id="tol" type="range" min={0} max={60} value={tolerance} onChange={e => setTolerance(+e.target.value)} className="w-full accent-brand-600" />
                <p className="text-xs text-gray-500">Higher removes more shades close to the background colour.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={removeAll} onChange={e => setRemoveAll(e.target.checked)} className="h-4 w-4 accent-brand-600" />
                Also remove enclosed areas (e.g. inside letters like O)
              </label>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mb-2">
                  <span>Background colour:</span>
                  {bgShown && <span className="inline-block h-5 w-5 rounded border border-gray-300" style={{ background: hex(bgShown) }} aria-hidden />}
                  <span className="font-mono text-xs">{bgShown ? hex(bgShown) : '…'}</span>
                  <span className="text-gray-500">{picked ? '(picked)' : '(auto-detected)'}</span>
                  {picked && <button type="button" onClick={() => setPicked(null)} className="text-xs underline text-brand-700 cursor-pointer">Reset to auto</button>}
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden flex justify-center" style={CHECKER}>
                  <canvas ref={pickRef} onClick={pick} className="max-w-full max-h-72 h-auto cursor-crosshair" aria-label="Preview - click to pick the background colour" />
                </div>
                <p className="mt-1 text-xs text-gray-500">Click the preview to pick the background colour.</p>
              </div>
            </div>
          )}
        </fieldset>

        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-gray-200 p-4">
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Non-square images</legend>
            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="fit" checked={mode === 'pad'} onChange={() => setMode('pad')} /> Pad with space</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="fit" checked={mode === 'crop'} onChange={() => setMode('crop')} /> Crop to square</label>
            </div>
            {ratioOff && <p className="text-xs text-gray-500 mt-1">This image is not square, so this choice changes the result.</p>}
          </fieldset>
          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={trim} onChange={e => setTrim(e.target.checked)} className="mt-1 h-4 w-4 accent-brand-600" />
            <span>Trim empty edges<span className="block text-xs text-gray-500">Crops transparent margins so the logo fills the icon.</span></span>
          </label>
          <div>
            <label htmlFor="pad" className="flex justify-between text-sm text-gray-700"><span>Padding</span><span className="tabular-nums text-gray-500">{padding}%</span></label>
            <input id="pad" type="range" min={0} max={40} value={padding} onChange={e => setPadding(+e.target.value)} className="w-full accent-brand-600" />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Corners (PNG icons)</legend>
            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              {([['none', 'Square'], ['rounded', 'Rounded'], ['circle', 'Circle']] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="shape" checked={shape === v} onChange={() => setShape(v)} /> {l}</label>
              ))}
            </div>
            {shape !== 'none' && (
              <label className="mt-2 flex items-center gap-2 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={shapeIco} onChange={e => setShapeIco(e.target.checked)} /> Also apply to favicon.ico</label>
            )}
          </fieldset>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium text-gray-700 mb-2">Icon background</legend>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="fill" checked={!solid} onChange={() => setSolid(false)} /> Transparent</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="fill" checked={solid} onChange={() => setSolid(true)} /> Solid colour</label>
              {solid && <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)} aria-label="Background colour" className="h-8 w-12 cursor-pointer rounded border border-gray-300" />}
            </div>
            <p className="text-xs text-gray-500 mt-1">iOS shows a transparent apple-touch-icon on black, so that icon always gets a solid background ({solid ? fillColor : APPLE_DEFAULT_FILL}).</p>
          </fieldset>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Panel dark={false} src={src} o={o} />
          <Panel dark src={src} o={o} />
        </div>

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
