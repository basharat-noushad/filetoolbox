// Browser-side PDF -> PDF/A via Ghostscript WebAssembly (public/ghostscript/, AGPL-3.0).
// The ~15 MB engine is fetched only on first use and stays compiled in the worker afterwards.

export type PdfALevel = 1 | 2 | 3
export type PdfAStage = 'loading' | 'converting'

type WorkerReply =
  | { type: 'loaded' }
  | { type: 'done'; bytes: ArrayBuffer }
  | { type: 'error'; code: 'password' | 'unreadable' | 'engine'; detail: string }

const MESSAGES = {
  password: 'This PDF is password-protected. Unlock it first, then convert it to PDF/A.',
  unreadable: 'This file could not be read as a PDF. It may be damaged. Please try another file.',
  engine: 'The conversion failed. The PDF may use features the converter cannot handle. Please try another file.',
}

let worker: Worker | null = null
let engineLoaded = false

export function convertToPdfA(file: File, level: PdfALevel = 2, onStage?: (s: PdfAStage) => void): Promise<Blob> {
  // Absolute URL: Turbopack can run code from blob: URLs, where relative paths break.
  worker ??= new Worker(new URL('/ghostscript/pdfa-worker.js', location.origin), { type: 'module' })
  const w = worker
  onStage?.(engineLoaded ? 'converting' : 'loading')

  return file.arrayBuffer().then(bytes => new Promise<Blob>((resolve, reject) => {
    const reset = () => { w.terminate(); if (worker === w) { worker = null; engineLoaded = false } }
    w.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
      if (data.type === 'loaded') { engineLoaded = true; onStage?.('converting'); return }
      if (data.type === 'done') { resolve(new Blob([data.bytes], { type: 'application/pdf' })); return }
      console.warn('PDF/A conversion failed:', data.detail)
      if (data.code === 'engine') reset() // wasm may be in a bad state; start clean next time
      reject(new Error(engineLoaded ? MESSAGES[data.code] : 'Could not load the conversion engine. Check your connection and try again.'))
    }
    w.onerror = () => { reset(); reject(new Error('Could not load the conversion engine. Check your connection and try again.')) }
    w.postMessage({ bytes, level }, [bytes])
  }))
}
