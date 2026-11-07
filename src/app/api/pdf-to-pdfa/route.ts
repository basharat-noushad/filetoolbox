import { guardUpload, upstreamError } from '@/lib/apiGuard'
import { stirlingFetch, stirlingUrl, STIRLING, STIRLING_LIMIT } from '@/lib/stirling'

export async function POST(request: Request) {
  if (!process.env.STIRLING_URL) return new Response('Conversion service not configured.', { status: 503 })
  const upload = await guardUpload(request, { exts: ['pdf'], ...STIRLING_LIMIT })
  if (upload instanceof Response) return upload

  const body = new FormData()
  body.append('fileInput', upload.blob, upload.name)
  body.append('outputFormat', 'pdfa-2b')

  const res = await stirlingFetch(stirlingUrl(STIRLING.pdfToPdfa), body)
  if (!res.ok) return upstreamError('pdf-to-pdfa', res)

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="converted-pdfa.pdf"',
    },
  })
}
