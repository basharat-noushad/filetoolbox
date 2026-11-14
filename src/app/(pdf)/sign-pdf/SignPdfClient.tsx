'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { renderPagePreview, signPdf, boxH, type Placement } from '@/lib/tools/pdf/signPdf'

type Snap = { url: string; ar: number }
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))

export function SignPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'draw' | 'upload'>('draw')
  const [sigImg, setSigImg] = useState<HTMLImageElement | null>(null)
  const [sigName, setSigName] = useState('')
  const [removeWhite, setRemoveWhite] = useState(false)
  const upRef = useRef<HTMLCanvasElement>(null)
  const [snaps, setSnaps] = useState<{ sig: Snap | null; date: Snap | null }>({ sig: null, date: null })
  const [placements, setPlacements] = useState<Placement[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<{ url: string; numPages: number; aspect: number; page: number } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const nextId = useRef(1)
  const stageRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; mode: 'move' | 'resize'; sx: number; sy: number; o: Placement } | null>(null)

  // Render the current page with pdf.js as the placement preview.
  useEffect(() => {
    if (!files[0]) { setPreview(null); return }
    let dead = false, url = ''
    setLoadingPreview(true)
    renderPagePreview(files[0], page).then(p => {
      if (dead) return
      url = URL.createObjectURL(p.blob)
      setPreview({ url, numPages: p.numPages, aspect: p.aspect, page })
    }).catch(() => { if (!dead) setError('Could not render that PDF. It may be damaged or password-protected.') })
      .finally(() => { if (!dead) setLoadingPreview(false) })
    return () => { dead = true; if (url) URL.revokeObjectURL(url) }
  }, [files, page])

  // Render the uploaded signature (max 1200px wide) onto its own canvas; PNG alpha is kept as-is.
  useEffect(() => {
    const c = upRef.current
    if (!c || !sigImg) return
    const k = Math.min(1, 1200 / sigImg.naturalWidth)
    c.width = Math.max(1, Math.round(sigImg.naturalWidth * k)); c.height = Math.max(1, Math.round(sigImg.naturalHeight * k))
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.drawImage(sigImg, 0, 0, c.width, c.height)
    if (removeWhite) {
      const d = ctx.getImageData(0, 0, c.width, c.height)
      for (let i = 0; i < d.data.length; i += 4) {
        const min = Math.min(d.data[i], d.data[i + 1], d.data[i + 2])
        if (min > 235) d.data[i + 3] = 0 // near-white -> transparent
        else if (min > 190) d.data[i + 3] = Math.round(d.data[i + 3] * (235 - min) / 45) // soften edges
      }
      ctx.putImageData(d, 0, 0)
    }
  }, [sigImg, removeWhite, mode])

  const loadSig = (f?: File) => {
    setResult(null)
    if (!f) return
    if (!/^image\/(png|jpeg)$/.test(f.type)) { setError('Signature image must be a PNG or JPG.'); return }
    const url = URL.createObjectURL(f)
    const img = new Image()
    img.onload = () => { setSigImg(img); setSigName(f.name); setError(null); URL.revokeObjectURL(url) }
    img.onerror = () => { setError('Could not read that image.'); URL.revokeObjectURL(url) }
    img.src = url
  }
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    lastPos.current = getPos(e)
  }, [])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.stroke()
    lastPos.current = pos
  }, [isDrawing])

  const stopDraw = useCallback(() => { setIsDrawing(false); lastPos.current = null }, [])

  const clearCanvas = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
  }

  const snapshotSig = (): Snap | null => {
    const canvas = mode === 'draw' ? canvasRef.current : upRef.current
    if (mode === 'upload' && !sigImg) { setError('Please upload a signature image first.'); return null }
    if (!canvas) return null
    const d = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
    if (d.data.every((v, i) => i % 4 === 3 ? v === 0 : true)) {
      setError(mode === 'draw' ? 'Please draw your signature first.' : 'The signature image is empty (everything was removed as white).')
      return null
    }
    return { url: canvas.toDataURL('image/png'), ar: canvas.height / canvas.width }
  }
  const snapshotDate = (): Snap => {
    const c = document.createElement('canvas'), ctx = c.getContext('2d')!
    const text = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    ctx.font = '600 56px sans-serif'
    c.width = Math.ceil(ctx.measureText(text).width) + 24; c.height = 84
    ctx.font = '600 56px sans-serif'; ctx.fillStyle = '#1a1a2e'; ctx.textBaseline = 'middle'
    ctx.fillText(text, 12, 44)
    return { url: c.toDataURL('image/png'), ar: c.height / c.width }
  }

  const addPlacement = (kind: 'sig' | 'date') => {
    if (!preview || preview.page !== page) return
    setError(null); setResult(null)
    const snap = kind === 'sig' ? snapshotSig() : snapshotDate()
    if (!snap) return
    setSnaps(s => ({ ...s, [kind]: snap }))
    const w = kind === 'sig' ? 0.3 : 0.22
    const h = boxH(w, snap.ar, preview.aspect)
    const n = placements.filter(p => p.page === page && p.kind === kind).length
    const id = nextId.current++
    setPlacements(ps => [...ps, { id, page, kind, w, x: clamp(0.08 + n * 0.03, 0, 1 - w), y: clamp((kind === 'sig' ? 0.8 : 0.9) - n * 0.03, 0, 1 - h) }])
    setSelected(id)
  }

  const applyToAll = () => {
    const src = placements.find(p => p.id === selected)
    if (!src || !preview) return
    setResult(null)
    setPlacements(ps => {
      const rest = ps.filter(p => p.kind !== src.kind || p.page === src.page)
      const extra: Placement[] = []
      for (let n = 1; n <= preview.numPages; n++) if (n !== src.page) extra.push({ ...src, id: nextId.current++, page: n })
      return [...rest, ...extra]
    })
  }

  const removePlacement = (id: number) => { setPlacements(ps => ps.filter(p => p.id !== id)); setSelected(s => (s === id ? null : s)); setResult(null) }
  const update = (id: number, f: (p: Placement) => Placement) => { setPlacements(ps => ps.map(p => (p.id === id ? f(p) : p))); setResult(null) }
  const arOf = (p: Placement) => snaps[p.kind]?.ar ?? 0.25
  const hOf = (p: Placement) => boxH(p.w, arOf(p), preview?.aspect ?? 0.7)

  const onBoxDown = (e: React.PointerEvent, p: Placement, m: 'move' | 'resize') => {
    e.preventDefault(); e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: p.id, mode: m, sx: e.clientX, sy: e.clientY, o: p }
    setSelected(p.id)
  }
  const onBoxMove = (e: React.PointerEvent) => {
    const d = drag.current, r = stageRef.current?.getBoundingClientRect()
    if (!d || !r || !preview) return
    e.stopPropagation()
    const dx = (e.clientX - d.sx) / r.width, dy = (e.clientY - d.sy) / r.height
    const k = arOf(d.o) * preview.aspect // box height / width in page fractions
    if (d.mode === 'move') {
      update(d.id, p => ({ ...p, x: clamp(d.o.x + dx, 0, 1 - p.w), y: clamp(d.o.y + dy, 0, 1 - p.w * k) }))
    } else {
      // corner handle: width follows the larger drag so the aspect ratio stays fixed
      const dw = Math.abs(dx) > Math.abs(dy / k) ? dx : dy / k
      const maxW = Math.min(1 - d.o.x, (1 - d.o.y) / k)
      update(d.id, p => ({ ...p, w: clamp(d.o.w + dw, 0.05, maxW) }))
    }
  }
  const endDrag = () => { drag.current = null }
  const onBoxKey = (e: React.KeyboardEvent, p: Placement) => {
    const step = e.shiftKey ? 0.03 : 0.005
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removePlacement(p.id); return }
    if (e.key === '+' || e.key === '=' || e.key === '-') {
      e.preventDefault()
      const dw = (e.key === '-' ? -1 : 1) * step * 2
      update(p.id, q => ({ ...q, w: clamp(q.w + dw, 0.05, Math.min(1 - q.x, (1 - q.y) / (arOf(q) * (preview?.aspect ?? 1)))) }))
      return
    }
    const mv = moves[e.key]
    if (!mv) return
    e.preventDefault()
    update(p.id, q => ({ ...q, x: clamp(q.x + mv[0], 0, 1 - q.w), y: clamp(q.y + mv[1], 0, 1 - hOf(q)) }))
  }

  const handleSign = async () => {
    if (files.length === 0) { setError('Please upload a PDF file.'); return }
    if (placements.length === 0) { setError('Add your signature to a page first.'); return }
    setProcessing(true); setError(null)
    try {
      const bytes = async (s: Snap | null) => (s ? new Uint8Array(await (await fetch(s.url)).arrayBuffer()) : null)
      setResult(await signPdf(files[0], placements, { sig: await bytes(snaps.sig), date: await bytes(snaps.date) }))
    } catch {
      setError('Failed to sign PDF. Please check your file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => { setFiles(f); setResult(null); setPlacements([]); setSelected(null); setPage(1); setError(null) }}
        label="Drag & drop your PDF here"
        sublabel="or click to browse — max 50MB"
      />
      <div className="flex gap-2" role="tablist">
        {([['draw', 'Draw signature'], ['upload', 'Upload signature image']] as const).map(([m, label]) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setResult(null); setError(null) }}
            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium cursor-pointer transition-all ${
              mode === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>{label}</button>
        ))}
      </div>
      {mode === 'upload' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Signature image (PNG or JPG)</label>
          <input type="file" accept="image/png,image/jpeg" onChange={e => loadSig(e.target.files?.[0])}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-gray-200 file:bg-white file:text-sm file:cursor-pointer" />
          {sigImg && (
            <>
              <canvas ref={upRef} aria-label={`Preview of ${sigName}`}
                className="mt-3 max-h-40 max-w-full border-2 border-dashed border-gray-300 rounded-lg"
                style={{ backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%)', backgroundSize: '16px 16px' }} />
              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={removeWhite} onChange={e => { setRemoveWhite(e.target.checked); setResult(null) }} />
                Remove white background (for JPG signatures; PNG transparency is kept automatically)
              </label>
            </>
          )}
        </div>
      )}
      <div className={mode === 'draw' ? '' : 'hidden'}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Draw your signature</label>
          <button onClick={clearCanvas} className="text-xs text-gray-500 hover:text-red-500 cursor-pointer transition-colors">Clear</button>
        </div>
        <canvas
          ref={canvasRef}
          width={600} height={150}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      {preview && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="cursor-pointer" disabled={preview.page !== page} onClick={() => addPlacement('sig')}>Add signature to this page</Button>
            <Button type="button" variant="outline" size="sm" className="cursor-pointer" disabled={preview.page !== page} onClick={() => addPlacement('date')}>Add today&apos;s date</Button>
            <Button type="button" variant="outline" size="sm" className="cursor-pointer" disabled={selected === null || preview.numPages < 2} onClick={applyToAll}>Apply selected to all pages</Button>
          </div>
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" className="cursor-pointer" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">&larr; Prev</Button>
            <span className="text-sm text-gray-700" aria-live="polite">Page {page} of {preview.numPages}</span>
            <Button type="button" variant="outline" size="sm" className="cursor-pointer" disabled={page >= preview.numPages} onClick={() => setPage(p => p + 1)} aria-label="Next page">Next &rarr;</Button>
          </div>
          <div ref={stageRef} data-stage className="relative mx-auto w-full max-w-[640px] border border-gray-300 shadow-sm bg-white select-none"
            style={{ aspectRatio: String(preview.aspect), opacity: loadingPreview ? 0.5 : 1 }} onPointerDown={() => setSelected(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt={`Preview of page ${page}`} draggable={false} className="absolute inset-0 w-full h-full pointer-events-none" />
            {preview.page === page && placements.filter(p => p.page === page).map(p => {
              const snap = snaps[p.kind]; if (!snap) return null
              const sel = p.id === selected
              return (
                <div key={p.id} tabIndex={0} role="group" data-placement={p.kind}
                  aria-label={`${p.kind === 'sig' ? 'Signature' : 'Date'} on page ${p.page}. Arrow keys move it, Shift plus arrows move it further, plus and minus resize it, Delete removes it.`}
                  onPointerDown={e => onBoxDown(e, p, 'move')} onPointerMove={onBoxMove} onPointerUp={endDrag} onPointerCancel={endDrag}
                  onFocus={() => setSelected(p.id)} onKeyDown={e => onBoxKey(e, p)}
                  className={`absolute cursor-move outline-none border-2 ${sel ? 'border-brand-600 border-solid' : 'border-brand-400/60 border-dashed'} focus-visible:ring-2 focus-visible:ring-brand-600`}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${p.w * 100}%`, height: `${hOf(p) * 100}%`, touchAction: 'none' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={snap.url} alt="" draggable={false} className="w-full h-full pointer-events-none" />
                  <div onPointerDown={e => onBoxDown(e, p, 'resize')} onPointerMove={onBoxMove} onPointerUp={endDrag} onPointerCancel={endDrag}
                    data-handle aria-hidden="true" className="absolute -right-2 -bottom-2 w-6 h-6 rounded-full bg-brand-600 border-2 border-white cursor-nwse-resize" style={{ touchAction: 'none' }} />
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400">Drag to move, drag the round corner handle to resize. Output pages keep their original size and rotation.</p>
          {placements.length > 0 && (
            <ul className="space-y-1" aria-label="Placements">
              {[...placements].sort((a, b) => a.page - b.page).map(p => (
                <li key={p.id} className={`flex items-center justify-between text-sm rounded-lg border px-3 py-1.5 ${p.id === selected ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}>
                  <button type="button" className="text-left cursor-pointer text-gray-700" onClick={() => { setPage(p.page); setSelected(p.id) }}>
                    {p.kind === 'sig' ? 'Signature' : 'Date'} &middot; page {p.page}
                  </button>
                  <button type="button" aria-label={`Remove ${p.kind === 'sig' ? 'signature' : 'date'} on page ${p.page}`} className="text-gray-400 hover:text-red-500 cursor-pointer px-2" onClick={() => removePlacement(p.id)}>&times;</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleSign} disabled={files.length === 0 || placements.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Signing…' : `Sign PDF${placements.length ? ` (${placements.length} placement${placements.length > 1 ? 's' : ''})` : ''}`}
      </Button>
      {result && <ToolResult blob={result} filename="signed.pdf" label="PDF signed successfully!" />}
    </div>
  )
}
