'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { deletePdfPages } from '@/lib/tools/pdf/deletePages'

interface PageThumb { pageNum: number; dataUrl: string }

async function renderThumbs(file: File, signal: AbortSignal): Promise<PageThumb[]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const thumbs: PageThumb[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    if (signal.aborted) break
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 0.4 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas } as Parameters<typeof page.render>[0]).promise
    thumbs.push({ pageNum: i, dataUrl: canvas.toDataURL('image/jpeg', 0.7) })
  }
  return thumbs
}

export function DeletePdfPagesClient() {
  const [file, setFile] = useState<File | null>(null)
  const [thumbs, setThumbs] = useState<PageThumb[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!file) { setThumbs([]); setSelected(new Set()); return }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setThumbs([])
    setSelected(new Set())
    setResult(null)
    setError(null)
    renderThumbs(file, ctrl.signal)
      .then(t => { if (!ctrl.signal.aborted) setThumbs(t) })
      .catch(() => { if (!ctrl.signal.aborted) setError('Failed to render PDF preview.') })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false) })
    return () => ctrl.abort()
  }, [file])

  const toggle = (n: number) => setSelected(prev => {
    const next = new Set(prev)
    next.has(n) ? next.delete(n) : next.add(n)
    return next
  })

  const toggleAll = () => {
    if (selected.size === thumbs.length) setSelected(new Set())
    else setSelected(new Set(thumbs.map(t => t.pageNum)))
  }

  const handleDelete = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    if (selected.size === 0) { setError('Select at least one page to delete.'); return }
    if (selected.size === thumbs.length) { setError('Cannot delete all pages.'); return }
    setProcessing(true); setError(null)
    try {
      setResult(await deletePdfPages(file, [...selected]))
    } catch {
      setError('Failed to delete pages. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => setFile(f[0] || null)}
        label="Drag & drop your PDF here"
      />

      {loading && (
        <div className="mt-6 text-center py-10">
          <div className="inline-block w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Rendering page thumbnails…</p>
        </div>
      )}

      {thumbs.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {thumbs.length} page{thumbs.length !== 1 ? 's' : ''} — click to select pages to delete
            </p>
            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <span className="text-sm text-red-600 font-medium">{selected.size} selected</span>
              )}
              <button onClick={toggleAll} className="text-sm text-brand-600 hover:text-brand-800 underline cursor-pointer">
                {selected.size === thumbs.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 max-h-[480px] overflow-y-auto pr-1">
            {thumbs.map(({ pageNum, dataUrl }) => {
              const sel = selected.has(pageNum)
              return (
                <button
                  key={pageNum}
                  onClick={() => toggle(pageNum)}
                  className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all focus:outline-none ${
                    sel
                      ? 'border-red-500 ring-2 ring-red-200'
                      : 'border-gray-200 hover:border-brand-400'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dataUrl} alt={`Page ${pageNum}`} className="w-full h-auto block" />
                  {sel && (
                    <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className={`absolute bottom-0 left-0 right-0 text-center text-xs py-0.5 font-medium ${
                    sel ? 'bg-red-500 text-white' : 'bg-black/40 text-white'
                  }`}>
                    {pageNum}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      <Button
        onClick={handleDelete}
        disabled={!file || selected.size === 0 || processing || loading}
        className="mt-4 w-full cursor-pointer"
        size="lg"
        variant={selected.size > 0 ? 'destructive' : 'default'}
      >
        {processing ? 'Deleting…' : selected.size > 0 ? `Delete ${selected.size} Page${selected.size !== 1 ? 's' : ''}` : 'Select Pages to Delete'}
      </Button>
      {result && <ToolResult blob={result} filename="cleaned.pdf" label={`${selected.size} page${selected.size !== 1 ? 's' : ''} deleted successfully!`} />}
    </div>
  )
}
