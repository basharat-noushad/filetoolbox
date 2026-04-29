'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

const RATIOS: { label: string; value: number | null }[] = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
]

interface CropBox { x: number; y: number; w: number; h: number }
interface DragState { type: string; startX: number; startY: number; origBox: CropBox }

const FULL: CropBox = { x: 0, y: 0, w: 100, h: 100 }
const MAX_H = 420

export function CropImageClient() {
  const [file, setFile] = useState<File | null>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [ratio, setRatio] = useState<number | null>(null)
  const [cropBox, setCropBox] = useState<CropBox>(FULL)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [imgDims, setImgDims] = useState<{ width: number; height: number } | null>(null)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // outerRef: always-rendered full-width div used to measure available width
  const outerRef = useRef<HTMLDivElement>(null)
  // containerRef: the exact-image-size div — pct() coords match 1:1 with image pixels
  const containerRef = useRef<HTMLDivElement>(null)
  // imgRef: the full-res hidden img element used only for drawImage in handleCrop
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<DragState | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgSrc(url)
    setCropBox(FULL)
    setResult(null)
    setError(null)
    setNaturalSize(null)
    setImgDims(null)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Called when the hidden img element loads — outerRef is already in the DOM at this point
  const onSrcLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    setNaturalSize({ w: nw, h: nh })

    const outerW = outerRef.current?.clientWidth ?? 640
    const scaleByW = outerW / nw
    const displayH = nh * scaleByW
    if (displayH <= MAX_H) {
      setImgDims({ width: outerW, height: Math.round(displayH) })
    } else {
      const scale = MAX_H / nh
      setImgDims({ width: Math.round(nw * scale), height: MAX_H })
    }
  }, [])

  useEffect(() => {
    if (!ratio) return
    setCropBox(prev => {
      const cx = prev.x + prev.w / 2
      const cy = prev.y + prev.h / 2
      let w = prev.w
      let h = w / ratio
      if (h > 100) { h = 100; w = h * ratio }
      if (w > 100) { w = 100; h = w / ratio }
      return {
        x: Math.max(0, Math.min(100 - w, cx - w / 2)),
        y: Math.max(0, Math.min(100 - h, cy - h / 2)),
        w, h,
      }
    })
  }, [ratio])

  const pct = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    }
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent, type: string) => {
    e.preventDefault()
    e.stopPropagation()
    const pt = pct(e)
    dragRef.current = { type, startX: pt.x, startY: pt.y, origBox: { ...cropBox } }
  }, [cropBox, pct])

  const onContainerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const pt = pct(e)
    dragRef.current = { type: 'new', startX: pt.x, startY: pt.y, origBox: { x: pt.x, y: pt.y, w: 0, h: 0 } }
  }, [pct])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    // Capture dragRef BEFORE setCropBox — React may flush the state update
    // after onMouseUp has already nulled dragRef.current
    const drag = dragRef.current
    if (!drag) return
    const pt = pct(e)
    const dx = pt.x - drag.startX
    const dy = pt.y - drag.startY
    const orig = drag.origBox

    setCropBox(() => {
      if (drag.type === 'new') {
        const nx = Math.min(drag.startX, pt.x)
        const ny = Math.min(drag.startY, pt.y)
        let nw = Math.abs(dx)
        let nh = Math.abs(dy)
        if (ratio) nh = nw / ratio
        return {
          x: Math.max(0, Math.min(100 - nw, nx)),
          y: Math.max(0, Math.min(100 - nh, ny)),
          w: Math.max(2, Math.min(nw, 100)),
          h: Math.max(2, Math.min(nh, 100)),
        }
      }

      if (drag.type === 'move') {
        return {
          x: Math.max(0, Math.min(100 - orig.w, orig.x + dx)),
          y: Math.max(0, Math.min(100 - orig.h, orig.y + dy)),
          w: orig.w,
          h: orig.h,
        }
      }

      let { x, y, w, h } = orig
      const t = drag.type
      if (t.includes('e')) w = Math.max(5, Math.min(orig.w + dx, 100 - orig.x))
      if (t.includes('s')) h = Math.max(5, Math.min(orig.h + dy, 100 - orig.y))
      if (t.includes('w')) { x = Math.max(0, Math.min(orig.x + dx, orig.x + orig.w - 5)); w = orig.x + orig.w - x }
      if (t.includes('n')) { y = Math.max(0, Math.min(orig.y + dy, orig.y + orig.h - 5)); h = orig.y + orig.h - y }
      if (ratio) h = w / ratio
      return { x, y, w, h }
    })
  }, [pct, ratio])

  const onMouseUp = useCallback(() => { dragRef.current = null }, [])

  const handleCrop = useCallback(async () => {
    if (!imgRef.current || !naturalSize) { setError('Please select an image first.'); return }
    setProcessing(true); setError(null)
    try {
      const { w: iw, h: ih } = naturalSize
      const sx = Math.round((cropBox.x / 100) * iw)
      const sy = Math.round((cropBox.y / 100) * ih)
      const sw = Math.max(1, Math.round((cropBox.w / 100) * iw))
      const sh = Math.max(1, Math.round((cropBox.h / 100) * ih))
      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      // imgRef is a full-res hidden img — drawImage reads natural pixels regardless of CSS size
      canvas.getContext('2d')!.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, sw, sh)
      canvas.toBlob(blob => {
        if (blob) { setResult(blob) } else { setError('Crop failed. Please try again.') }
        setProcessing(false)
      }, file?.type || 'image/jpeg', 0.95)
    } catch {
      setError('Crop failed. Please try again.')
      setProcessing(false)
    }
  }, [file, cropBox, naturalSize])

  const ext = file?.name.split('.').pop()?.toLowerCase() || 'jpg'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        onFilesSelected={f => { setFile(f[0] || null); setResult(null) }}
        label="Drag & drop your image here"
      />

      {imgSrc && (
        <>
          {/* Hidden full-res img — always mounted, fires onSrcLoad, used by drawImage */}
          <img
            ref={imgRef}
            src={imgSrc}
            alt=""
            aria-hidden="true"
            onLoad={onSrcLoad}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            draggable={false}
          />

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Aspect Ratio</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {RATIOS.map(r => (
                <button key={r.label} onClick={() => setRatio(r.value)}
                  className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    ratio === r.value
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-2">Drag to draw crop area. Drag edges or corners to resize. Drag inside to move.</p>

            {/*
              outerRef: always rendered — clientWidth read in onSrcLoad to compute imgDims.
              containerRef: sized exactly to imgDims — pct() coords map 1:1 to natural image pixels.
            */}
            <div ref={outerRef} className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex justify-center items-center min-h-16">
              {!imgDims ? (
                <div className="py-10">
                  <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div
                  ref={containerRef}
                  className="relative select-none"
                  style={{ width: imgDims.width, height: imgDims.height, cursor: 'crosshair', touchAction: 'none', flexShrink: 0 }}
                  onMouseDown={onContainerMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                >
                  {/* Visible scaled image — same src, browser uses cache */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt="Crop preview"
                    className="block pointer-events-none"
                    style={{ width: imgDims.width, height: imgDims.height }}
                    draggable={false}
                  />

                  {/* 4-piece overlay around crop box */}
                  <div className="absolute inset-x-0 top-0 bg-black/50 pointer-events-none"
                    style={{ height: `${cropBox.y}%` }} />
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 pointer-events-none"
                    style={{ height: `${100 - cropBox.y - cropBox.h}%` }} />
                  <div className="absolute left-0 bg-black/50 pointer-events-none"
                    style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, width: `${cropBox.x}%` }} />
                  <div className="absolute right-0 bg-black/50 pointer-events-none"
                    style={{ top: `${cropBox.y}%`, height: `${cropBox.h}%`, width: `${100 - cropBox.x - cropBox.w}%` }} />

                  {/* Crop box */}
                  <div
                    className="absolute border-2 border-white"
                    style={{
                      left: `${cropBox.x}%`, top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`, height: `${cropBox.h}%`,
                      cursor: 'move',
                    }}
                    onMouseDown={e => onMouseDown(e, 'move')}
                  >
                    {/* Rule-of-thirds grid */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                      backgroundSize: '33.33% 33.33%',
                    }} />

                    {/* Corner handles */}
                    {(['nw', 'ne', 'sw', 'se'] as const).map(pos => (
                      <div key={pos}
                        className="absolute w-3 h-3 bg-white border-2 border-brand-600 rounded-sm z-10"
                        style={{
                          top: pos.startsWith('n') ? -6 : 'auto',
                          bottom: pos.startsWith('s') ? -6 : 'auto',
                          left: pos.endsWith('w') ? -6 : 'auto',
                          right: pos.endsWith('e') ? -6 : 'auto',
                          cursor: `${pos}-resize`,
                        }}
                        onMouseDown={e => onMouseDown(e, pos)}
                      />
                    ))}

                    {/* Edge handles */}
                    {[
                      { pos: 'n', style: { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
                      { pos: 's', style: { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
                      { pos: 'w', style: { left: -5, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' } },
                      { pos: 'e', style: { right: -5, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' } },
                    ].map(({ pos, style }) => (
                      <div key={pos}
                        className="absolute w-3 h-3 bg-white border-2 border-brand-600 rounded-sm z-10"
                        style={style as React.CSSProperties}
                        onMouseDown={e => onMouseDown(e, pos)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-1">
              {naturalSize && imgDims
                ? `Output: ${Math.round(cropBox.w / 100 * naturalSize.w)} × ${Math.round(cropBox.h / 100 * naturalSize.h)} px`
                : ''}
            </p>
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      <Button onClick={handleCrop} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Cropping…' : 'Crop Image'}
      </Button>
      {result && <ToolResult blob={result} filename={`cropped.${ext}`} label="Image cropped successfully!" />}
    </div>
  )
}
