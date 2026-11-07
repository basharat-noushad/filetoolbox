import { guardUpload, upstreamError } from '@/lib/apiGuard'
import { stirlingFetch, stirlingUrl, STIRLING, STIRLING_LIMIT } from '@/lib/stirling'

export async function POST(request: Request) {
  if (!process.env.STIRLING_URL) return new Response('Conversion service not configured.', { status: 503 })
  const upload = await guardUpload(request, { exts: ['docx', 'doc'], ...STIRLING_LIMIT })
  if (upload instanceof Response) return upload

  const body = new FormData()
  body.append('fileInput', upload.blob, upload.name)

  const res = await stirlingFetch(stirlingUrl(STIRLING.fileToPdf), body)
  if (!res.ok) return upstreamError('word-to-pdf', res)

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="converted.pdf"',
    },
  })
}
