import { guardUpload, upstreamError } from '@/lib/apiGuard'
import { stirlingFetch, stirlingUrl, STIRLING, STIRLING_LIMIT } from '@/lib/stirling'

export async function POST(request: Request) {
  if (!process.env.STIRLING_URL) return new Response('Conversion service not configured.', { status: 503 })
  const upload = await guardUpload(request, { exts: ['pdf'], ...STIRLING_LIMIT })
  if (upload instanceof Response) return upload

  const body = new FormData()
  body.append('fileInput', upload.blob, upload.name)
  body.append('pageNumbers', 'all')

  const res = await stirlingFetch(stirlingUrl(STIRLING.pdfToXlsx), body)
  if (res.status === 204) return new Response('No table data found in this PDF.', { status: 422 })
  if (!res.ok) return upstreamError('pdf-to-excel', res)

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="converted.xlsx"',
    },
  })
}
