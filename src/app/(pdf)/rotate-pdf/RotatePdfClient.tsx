'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { rotatePdf, RotationAngle } from '@/lib/tools/pdf/rotate'

export function RotatePdfClient() {
  const [file, setFile] = useState<File | null>(null)
  const [angle, setAngle] = useState<RotationAngle>(90)
  const [mode, setMode] = useState<'all' | 'specific'>('all')
  const [pageInput, setPageInput] = useState('')
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRotate = async () => {
    if (!file) { setError('Please select a PDF file first.'); return }
    let pageIndices: number[] | undefined
    if (mode === 'specific') {
      const nums = pageInput.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n) && n >= 0)
      if (nums.length === 0) { setError('Enter valid page numbers.'); return }
      pageIndices = nums
    }
    setProcessing(true); setError(null)
    try {
      setResult(await rotatePdf(file, angle, pageIndices))
    } catch {
      setError('Rotation failed. Please try again.')
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
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Rotation Angle</p>
          <div className="flex flex-col gap-2">
            {([['90° Right', 90], ['180°', 180], ['90° Left', 270]] as [string, RotationAngle][]).map(([label, val]) => (
              <button key={val} onClick={() => setAngle(val)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium text-left transition-all cursor-pointer ${
                  angle === val ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Pages to Rotate</p>
          <div className="flex flex-col gap-2">
            {(['all', 'specific'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize text-left transition-all cursor-pointer ${
                  mode === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                {m === 'all' ? 'All pages' : 'Specific pages'}
              </button>
            ))}
          </div>
          {mode === 'specific' && (
            <input type="text" value={pageInput} onChange={e => setPageInput(e.target.value)}
              placeholder="e.g. 1, 3, 5"
              className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          )}
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleRotate} disabled={!file || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Rotating…' : 'Rotate PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="rotated.pdf" label="PDF rotated successfully!" />}
    </div>
  )
}
