'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Check, Copy, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { decodeBlob, decodeQr } from '@/lib/tools/image/qrDecode'
import { parseQr, type ParsedQr } from '@/lib/tools/image/qrParse'

export function QrCodeScannerClient() {
  const [text, setText] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [camera, setCamera] = useState(false)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCamera(false)
  }, [])
  useEffect(() => stopCamera, [stopCamera]) // stop the stream on unmount
  useEffect(() => () => { if (imgUrl) URL.revokeObjectURL(imgUrl) }, [imgUrl])

  const scanFile = useCallback(async (file: Blob) => {
    stopCamera(); setBusy(true); setError(null); setText(null)
    setImgUrl(URL.createObjectURL(file))
    try {
      const r = await decodeBlob(file)
      if (r) setText(r)
      else setError('No QR code found in that image. Crop closer to the code, avoid glare and blur, and keep its white border in view.')
    } catch { setError('Could not read that image. Try a PNG or JPG.') } finally { setBusy(false) }
  }, [stopCamera])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []).find(x => x.type.startsWith('image/'))
      if (f) { e.preventDefault(); scanFile(f) }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [scanFile])

  const startCamera = async () => {
    setError(null); setText(null); setImgUrl(null)
    if (!navigator.mediaDevices?.getUserMedia) { setError('Your browser does not support camera access. Upload an image instead.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      setCamera(true)
    } catch { setError('Camera access was blocked or no camera was found. Allow it in your browser settings, or upload an image instead.') }
  }

  // attach the stream and decode frames while the camera is on
  useEffect(() => {
    const v = videoRef.current, stream = streamRef.current
    if (!camera || !v || !stream) return
    v.srcObject = stream
    v.play().catch(() => {})
    let live = true
    const loop = async () => {
      while (live) {
        if (v.videoWidth) {
          const r = await decodeQr(v, v.videoWidth, v.videoHeight, false)
          if (r && live) { setText(r); stopCamera(); return }
        }
        await new Promise(res => setTimeout(res, 200))
      }
    }
    loop()
    return () => { live = false }
  }, [camera, stopCamera])

  const copy = async () => {
    if (!text) return
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setError('Could not copy. Select the text and copy it manually.') }
  }
  const parsed: ParsedQr | null = text ? parseQr(text) : null

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4">
      {!camera && (
        <FileDropzone
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'] }}
          onFilesSelected={files => { if (files[0]) scanFile(files[0]) }}
          label="Drop, choose or paste (Ctrl+V) an image with a QR code"
          privacyNote="Decoded in your browser. The image is never uploaded."
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        {camera
          ? <Button onClick={stopCamera} variant="outline" className="cursor-pointer">Stop camera</Button>
          : <Button onClick={startCamera} variant="outline" className="gap-2 cursor-pointer"><Camera className="w-4 h-4" aria-hidden />Use camera</Button>}
        <span className="text-xs text-gray-500">The browser will ask for permission. Video stays on your device.</span>
      </div>
      {camera && (
        <div>
          <video ref={videoRef} muted playsInline aria-label="Camera preview" className="w-full max-w-md mx-auto rounded-xl bg-black aspect-video object-cover" />
          <p className="mt-2 text-sm text-gray-600 text-center" aria-live="polite">Point the camera at a QR code…</p>
        </div>
      )}
      {busy && <p className="text-sm text-gray-600" aria-live="polite">Looking for a QR code…</p>}
      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {imgUrl && !camera && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgUrl} alt="Uploaded image being scanned" className="max-h-48 mx-auto rounded-lg border border-gray-200" />
      )}

      {text !== null && parsed && (
        <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 sm:p-5" aria-live="polite">
          <p className="flex items-center gap-2 font-semibold text-emerald-800"><Check className="w-5 h-5" aria-hidden />QR code found: {parsed.label}</p>
          {parsed.fields.length > 0 && (
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {parsed.fields.map(([k, v]) => <div key={k} className="contents"><dt className="text-gray-600">{k}</dt><dd className="font-medium text-gray-900 break-words whitespace-pre-wrap">{v}</dd></div>)}
            </dl>
          )}
          <label htmlFor="qr-out" className="block text-xs font-medium text-gray-600 mt-4 mb-1">Raw content</label>
          <textarea id="qr-out" readOnly rows={Math.min(8, text.split('\n').length + 1)} value={text} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono break-all" />
          {parsed.url && (
            <div className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex gap-2">
              <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              <p>Check the link before opening it. QR codes can hide phishing or look-alike sites. <a href={parsed.url} target="_blank" rel="noopener noreferrer" className="font-medium underline break-all">Open {parsed.url}</a></p>
            </div>
          )}
          <Button onClick={copy} className="mt-4 gap-2 cursor-pointer">{copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}{copied ? 'Copied' : 'Copy content'}</Button>
        </div>
      )}
    </div>
  )
}
