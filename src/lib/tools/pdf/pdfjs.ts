import type { PDFDocumentProxy } from 'pdfjs-dist'

// Single entry point for PDF.js so the worker path, load options and cleanup live in one place.
// public/pdf.worker.min.js is copied from node_modules by the "postinstall" script,
// so the worker always matches the installed pdfjs-dist version.
// pdfjs-dist >= 6 removed the eval-based font path entirely (GHSA-hq66-cqwq-w95j),
// so there is no `isEvalSupported` option to pass any more.
export async function withPdf<T>(file: File, fn: (pdf: PDFDocumentProxy) => Promise<T>): Promise<T> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() })
  try {
    return await fn(await task.promise)
  } finally {
    await task.destroy() // v6: destroy lives on the loading task; frees the worker
  }
}
