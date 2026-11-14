'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import { mp4ToMp3, NoAudioError, MAX_VIDEO_BYTES } from '@/lib/tools/image/mp4ToMp3'

const RATES = [128, 192, 320] as const

export function Mp4ToMp3Client() {
  const [files, setFiles] = useState<File[]>([])
  const [kbps, setKbps] = useState<128 | 192 | 320>(192)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setResult(null); setError(null) }

  const handle = async () => {
    const file = files[0]
    if (!file) { setError('Please select a video file.'); return }
    if (file.size > MAX_VIDEO_BYTES) { setError('This file is over 50MB. Please use a smaller video; conversion runs on your device and large files may fail.'); return }
    setProcessing(true); reset(); setProgress(0)
    try {
      setResult(await mp4ToMp3(file, kbps, setProgress))
    } catch (e) {
      setError(e instanceof NoAudioError ? 'This video has no audio track, so there is nothing to convert to MP3.' : 'Conversion failed. Please check your video file and try again.')
    } finally {
      setProcessing(false); setProgress(null)
    }
  }

  const base = files[0]?.name.replace(/\.[^.]+$/, '') || 'audio'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        Note: First conversion loads FFmpeg (~30MB). Subsequent conversions in the same session are instant.
      </div>
      <FileDropzone
        accept={{ 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/webm': ['.webm'], 'video/x-matroska': ['.mkv'] }}
        onFilesSelected={f => { setFiles(f); reset() }}
        label="Drag & drop your MP4, MOV, WebM or MKV file here"
        sublabel="or click to browse - max 50MB recommended"
      />
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">MP3 quality</legend>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          {RATES.map(r => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="kbps" checked={kbps === r} onChange={() => { setKbps(r); reset() }} /> {r} kbps
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      {processing && progress !== null && (
        <div role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-brand-600 transition-[width]" style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }} />
        </div>
      )}
      <Button onClick={handle} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? `Converting${progress ? ` ${Math.round(progress * 100)}%` : ''}…` : 'Convert to MP3'}
      </Button>
      {result && <ToolResult blob={result} filename={`${base}.mp3`} label="Audio extracted as MP3!" />}
    </div>
  )
}
