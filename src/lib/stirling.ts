import { upstreamFetch } from '@/lib/apiGuard'

export function stirlingUrl(path: string): string {
  const base = process.env.STIRLING_URL
  if (!base) throw new Error('STIRLING_URL not configured')
  return `${base}${path}`
}

export async function stirlingFetch(url: string, body: FormData): Promise<Response> {
  return upstreamFetch('stirling', url, { method: 'POST', body }, 60_000)
}

// Shared per-IP budget across all Stirling-backed routes.
export const STIRLING_LIMIT = { bucket: 'stirling', perHour: 30 } as const

export const STIRLING = {
  fileToPdf:       '/api/v1/convert/file/pdf',
  pdfToWord:       '/api/v1/convert/pdf/word',
  pdfToXlsx:       '/api/v1/convert/pdf/xlsx',
  pdfToPresentation: '/api/v1/convert/pdf/presentation',
  pdfToPdfa:       '/api/v1/convert/pdf/pdfa',
  addPassword:     '/api/v1/security/add-password',
  removePassword:  '/api/v1/security/remove-password',
} as const
