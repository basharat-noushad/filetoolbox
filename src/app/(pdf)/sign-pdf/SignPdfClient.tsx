'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'

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

  const handleSign = async () => {
    if (files.length === 0) { setError('Please upload a PDF file.'); return }
    const canvas = (mode === 'draw' ? canvasRef.current : upRef.current)!
    if (mode === 'upload' && !sigImg) { setError('Please upload a signature image first.'); return }
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const isEmpty = imageData.data.every((val, i) => i % 4 === 3 ? val === 0 : true)
    if (isEmpty) { setError(mode === 'draw' ? 'Please draw your signature first.' : 'The signature image is empty (everything was removed as white).'); return }

    setProcessing(true); setError(null)
    try {
      const { PDFDocument } = await import('pdf-lib')
      const pdf = await PDFDocument.load(await files[0].arrayBuffer())
      const signatureDataUrl = canvas.toDataURL('image/png')
      const signatureBytes = await fetch(signatureDataUrl).then(r => r.arrayBuffer())
      const sigImage = await pdf.embedPng(signatureBytes)
      const pages = pdf.getPages()
      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()
      const sigW = Math.min(200, width * 0.3)
      const sigH = sigW * (canvas.height / canvas.width)
      firstPage.drawImage(sigImage, { x: 40, y: 40, width: sigW, height: sigH })
      const saved = await pdf.save()
      setResult(new Blob([saved.buffer as ArrayBuffer], { type: 'application/pdf' }))
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
        onFilesSelected={f => { setFiles(f); setResult(null) }}
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
          <p className="text-xs text-gray-400 mt-1">Signature will be placed at the bottom-left of the first page.</p>
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
        <p className="text-xs text-gray-400 mt-1">Signature will be placed at the bottom-left of the first page.</p>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleSign} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Signing…' : 'Add Signature to PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="signed.pdf" label="PDF signed successfully!" />}
    </div>
  )
}
