import { stirlingFetch, stirlingUrl, STIRLING } from '@/lib/stirling'

export async function POST(request: Request) {
  if (!process.env.STIRLING_URL) return new Response('Protection service not configured.', { status: 503 })
  const formData = await request.formData()
  const file = formData.get('file') as File
  const password = formData.get('password') as string
  if (!file) return new Response('No file provided.', { status: 400 })
  if (!password) return new Response('No password provided.', { status: 400 })

  const body = new FormData()
  body.append('fileInput', new Blob([await file.arrayBuffer()], { type: 'application/pdf' }), file.name)
  body.append('password', password)

  const res = await stirlingFetch(stirlingUrl(STIRLING.addPassword), body)
  if (!res.ok) return new Response('Failed to protect PDF. Please try again.', { status: 502 })

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="protected.pdf"',
    },
  })
}
