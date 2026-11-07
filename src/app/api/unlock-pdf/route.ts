import { guardUpload, upstreamError } from '@/lib/apiGuard'
import { stirlingFetch, stirlingUrl, STIRLING, STIRLING_LIMIT } from '@/lib/stirling'

// Stirling/PDFBox wrong-password errors read like "...password was not provided or was incorrect"
// or "Cannot decrypt PDF, the password is incorrect".
const WRONG_PASSWORD = /password[\s\S]{0,80}(incorrect|invalid|wrong)|(incorrect|invalid|wrong)[\s\S]{0,20}password/i

export async function POST(request: Request) {
  if (!process.env.STIRLING_URL) return new Response('Unlock service not configured.', { status: 503 })
  const upload = await guardUpload(request, { exts: ['pdf'], ...STIRLING_LIMIT })
  if (upload instanceof Response) return upload
  const password = upload.form.get('password')
  if (typeof password !== 'string' || !password) return new Response('No password provided.', { status: 400 })
  if (password.length > 256) return new Response('Password is too long.', { status: 400 })

  const body = new FormData()
  body.append('fileInput', upload.blob, upload.name)
  body.append('password', password)

  const res = await stirlingFetch(stirlingUrl(STIRLING.removePassword), body)
  if (!res.ok) {
    // Body is inspected only to classify the error; it is never returned to the client.
    if (WRONG_PASSWORD.test((await res.text()).slice(0, 4000))) {
      console.error(`[unlock-pdf] upstream status ${res.status} (wrong password)`)
      return new Response('Incorrect password.', { status: 400 })
    }
    return upstreamError('unlock-pdf', res, 'Failed to unlock PDF. Check that the password is correct and try again.')
  }

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="unlocked.pdf"',
    },
  })
}
