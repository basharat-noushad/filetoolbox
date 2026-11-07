import { guardUpload, upstreamError } from '@/lib/apiGuard'
import { stirlingFetch, stirlingUrl, STIRLING, STIRLING_LIMIT } from '@/lib/stirling'

export async function POST(request: Request) {
  if (!process.env.STIRLING_URL) return new Response('Protection service not configured.', { status: 503 })
  const upload = await guardUpload(request, { exts: ['pdf'], ...STIRLING_LIMIT })
  if (upload instanceof Response) return upload
  const password = upload.form.get('password')
  if (typeof password !== 'string' || !password) return new Response('No password provided.', { status: 400 })
  if (password.length > 256) return new Response('Password is too long.', { status: 400 })

  const body = new FormData()
  body.append('fileInput', upload.blob, upload.name)
  body.append('password', password)

  const res = await stirlingFetch(stirlingUrl(STIRLING.addPassword), body)
  if (!res.ok) return upstreamError('protect-pdf', res, 'Failed to protect PDF. Please try again.')

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="protected.pdf"',
    },
  })
}
