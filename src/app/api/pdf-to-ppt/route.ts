import { stirlingFetch, stirlingUrl, STIRLING } from '@/lib/stirling'

export async function POST(request: Request) {
  if (!process.env.STIRLING_URL) return new Response('Conversion service not configured.', { status: 503 })
  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return new Response('No file provided.', { status: 400 })

  const body = new FormData()
  body.append('fileInput', new Blob([await file.arrayBuffer()], { type: 'application/pdf' }), file.name)
  body.append('outputFormat', 'pptx')

  const res = await stirlingFetch(stirlingUrl(STIRLING.pdfToPresentation), body)
  if (!res.ok) return new Response('Conversion failed. Please try again.', { status: 502 })

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': 'attachment; filename="converted.pptx"',
    },
  })
}
