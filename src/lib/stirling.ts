export function stirlingUrl(path: string): string {
  const base = process.env.STIRLING_URL
  if (!base) throw new Error('STIRLING_URL not configured')
  return `${base}${path}`
}

export async function stirlingFetch(url: string, body: FormData): Promise<Response> {
  return fetch(url, { method: 'POST', body, cache: 'no-store' })
}

export const STIRLING = {
  fileToPdf:       '/api/v1/convert/file/pdf',
  pdfToWord:       '/api/v1/convert/pdf/word',
  pdfToXlsx:       '/api/v1/convert/pdf/xlsx',
  pdfToPresentation: '/api/v1/convert/pdf/presentation',
  pdfToPdfa:       '/api/v1/convert/pdf/pdfa',
  addPassword:     '/api/v1/security/add-password',
  removePassword:  '/api/v1/security/remove-password',
} as const
