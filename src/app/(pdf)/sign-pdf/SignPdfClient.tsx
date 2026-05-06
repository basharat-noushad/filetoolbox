'use client'
import { useState, useRef, useCallback } from 'react'
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
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const isEmpty = imageData.data.every((val, i) => i % 4 === 3 ? val === 0 : true)
    if (isEmpty) { setError('Please draw your signature first.'); return }

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
        onFilesSelected={setFiles}
        label="Drag & drop your PDF here"
        sublabel="or click to browse — max 50MB"
      />
      <div>
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
