'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { convertImageFormat } from '@/lib/tools/image/convert'
import JSZip from 'jszip'

interface ToJpgClientProps {
  accept: Record<string, string[]>
  /** e.g. "PNG", "WebP" — used in labels and error messages */
  sourceLabel: string
  sublabel?: string
}

const stripExt = (name: string) => name.replace(/\.[^.]+$/, '')

export function ToJpgClient({ accept, sourceLabel, sublabel = 'Multiple files supported' }: ToJpgClientProps) {
  const [files, setFiles] = useState<File[]>([])
  const [quality, setQuality] = useState(85)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (files.length === 0) { setError(`Please select at least one ${sourceLabel} image.`); return }
    setProcessing(true); setError(null); setResult(null)
    try {
      if (files.length === 1) {
        setResult(await convertImageFormat(files[0], 'image/jpeg', quality / 100))
      } else {
        const zip = new JSZip()
        const used = new Set<string>()
        for (const f of files) {
          const blob = await convertImageFormat(f, 'image/jpeg', quality / 100)
          let name = `${stripExt(f.name)}.jpg`
          for (let n = 2; used.has(name); n++) name = `${stripExt(f.name)}-${n}.jpg`
          used.add(name)
          zip.file(name, blob)
        }
        setResult(await zip.generateAsync({ type: 'blob' }))
      }
    } catch {
      setError(`Could not convert this ${sourceLabel} file. Your browser may not support decoding it, or the file may be damaged. Try a recent version of Chrome, Edge, Firefox or Safari.`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <FileDropzone
        accept={accept} multiple maxFiles={20}
        onFilesSelected={f => { setFiles(f); setResult(null); setError(null) }}
        label={`Drag & drop ${sourceLabel} images here`}
        sublabel={sublabel}
      />
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">JPG Quality: {quality}%</label>
        </div>
        <input type="range" min={10} max={100} value={quality} onChange={e => { setQuality(Number(e.target.value)); setResult(null) }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Smaller file</span><span>Better quality</span></div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleConvert} disabled={files.length === 0 || processing} className="mt-4 w-full cursor-pointer" size="lg">
        {processing ? 'Converting…' : `Convert ${files.length > 0 ? files.length + ' file' + (files.length > 1 ? 's' : '') : ''} to JPG`}
      </Button>
      {result && <ToolResult blob={result} filename={files.length > 1 ? 'converted.zip' : `${stripExt(files[0]?.name ?? 'converted')}.jpg`} label="Converted to JPG successfully!" />}
    </div>
  )
}
