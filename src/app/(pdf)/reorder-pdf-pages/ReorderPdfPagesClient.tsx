'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { reorderPdfPages } from '@/lib/tools/pdf/reorderPages'

export function ReorderPdfPagesClient() {
  const [files, setFiles] = useState<File[]>([])
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [orderInput, setOrderInput] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFilesSelected = async (selected: File[]) => {
    setFiles(selected)
    setResult(null)
    setError(null)
    setOrderInput('')
    setPageCount(null)

    if (selected.length > 0) {
      try {
        const { PDFDocument } = await import('pdf-lib')
        const buf = await selected[0].arrayBuffer()
        const pdf = await PDFDocument.load(buf)
        const count = pdf.getPageCount()
        setPageCount(count)
        setOrderInput(Array.from({ length: count }, (_, i) => i + 1).join(','))
      } catch {
        setError('Could not read the PDF. Please check the file and try again.')
      }
    }
  }

  const parseOrder = (input: string): number[] | null => {
    const parts = input.split(',').map(s => s.trim())
    const nums: number[] = []
    for (const part of parts) {
      const n = parseInt(part, 10)
      if (isNaN(n) || n < 1) return null
      nums.push(n)
    }
    return nums
  }

  const handleProcess = async () => {
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    if (!orderInput.trim()) { setError('Please enter the new page order.'); return }

    const order = parseOrder(orderInput)
    if (!order) { setError('Invalid page order. Please enter comma-separated page numbers (e.g. "3,1,2,4").'); return }
    if (pageCount !== null && order.length !== pageCount) {
      setError(`Your PDF has ${pageCount} pages. Please include all ${pageCount} page numbers in your order.`)
      return
    }

    setProcessing(true)
    setError(null)
    try {
      setResult(await reorderPdfPages(files[0], order))
    } catch {
      setError('An error occurred while reordering pages. Please check your file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={handleFilesSelected}
        label="Drag & drop your PDF here"
        sublabel="or click to browse — max 50MB"
      />

      {pageCount !== null && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">
            This PDF has <strong>{pageCount} pages</strong>. Enter the new order as comma-separated page numbers:
          </p>
          <input
            type="text"
            value={orderInput}
            onChange={e => setOrderInput(e.target.value)}
            placeholder={`e.g. ${Array.from({ length: Math.min(pageCount, 4) }, (_, i) => i + 1).reverse().join(',')}`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-gray-400 mt-1">All {pageCount} page numbers must be included.</p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}

      <Button
        onClick={handleProcess}
        disabled={files.length === 0 || processing}
        className="mt-4 w-full cursor-pointer"
        size="lg"
      >
        {processing ? 'Reordering…' : 'Reorder Pages'}
      </Button>

      {result && (
        <ToolResult blob={result} filename="reordered.pdf" label="Pages reordered successfully!" />
      )}
    </div>
  )
}
