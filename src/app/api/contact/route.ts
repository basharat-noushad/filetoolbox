import { clientIp, limit } from '@/lib/apiGuard'

// Public endpoint that sends email: every guard here is anti-spam / quota protection.
const SUBJECTS = ['General', 'Bug report', 'Tool request', 'Privacy', 'Business'] as const

const MAX_BODY = 10 * 1024
const MIN_ELAPSED_MS = 3000
const MIN = 60_000, DAY = 24 * 60 * MIN
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"\x00-\x1f\x7f]{1,64}@[^\s@<>()[\]\\,;:"\x00-\x1f\x7f]+\.[A-Za-z]{2,63}$/

const json = (body: object, status = 200, headers?: HeadersInit) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
const fail = (status: number, error: string, headers?: HeadersInit) => json({ error }, status, headers)

// Header-bound values: drop CR/LF and every other control char (header injection), collapse whitespace.
const oneLine = (s: string) => s.replace(/[\x00-\x1f\x7f]+/g, ' ').replace(/\s+/g, ' ').trim()
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function allowedOrigin(request: Request): boolean {
  const src = request.headers.get('origin') || request.headers.get('referer')
  if (!src) return false
  let origin: URL
  try { origin = new URL(src) } catch { return false }
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com')
  const bare = site.hostname.replace(/^www\./, '')
  if (origin.protocol === 'https:' && (origin.hostname === bare || origin.hostname === `www.${bare}`)) return true
  return process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(origin.hostname)
}

const LIMITS = (ip: string) => [
  { key: `contact:10m:${ip}`, max: 3, windowMs: 10 * MIN },
  { key: `contact:day:${ip}`, max: 10, windowMs: DAY },
  { key: 'contact:global', max: 200, windowMs: DAY }, // protects the Resend free-tier quota
]

async function overLimit(ip: string, consume: boolean): Promise<number | null> {
  for (const l of LIMITS(ip)) {
    const retry = await limit(l.key, l.max, consume, l.windowMs)
    if (retry !== null) return retry
  }
  return null
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) return fail(403, 'Forbidden.')
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return fail(415, 'Unsupported request.')
  if (Number(request.headers.get('content-length')) > MAX_BODY) return fail(413, 'Message is too large.')

  const ip = clientIp(request)
  const tooMany = (retry: number) =>
    fail(429, 'Too many messages. Please try again later or email us directly.', { 'Retry-After': String(retry) })
  const early = await overLimit(ip, false)
  if (early !== null) return tooMany(early)

  let raw: string
  try { raw = await request.text() } catch { return fail(400, 'Invalid request.') }
  if (new TextEncoder().encode(raw).length > MAX_BODY) return fail(413, 'Message is too large.')
  let body: Record<string, unknown>
  try { body = JSON.parse(raw) } catch { return fail(400, 'Invalid request.') }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'Invalid request.')

  const str = (k: string) => (typeof body[k] === 'string' ? (body[k] as string) : '')
  // Honeypot: bots get a fake success so they don't adapt; nothing is sent.
  if (str('website')) return json({ ok: true })
  const elapsed = Number(body.elapsed)
  if (!Number.isFinite(elapsed) || elapsed < MIN_ELAPSED_MS) return fail(400, 'That was quick! Please wait a moment and try again.')

  const name = oneLine(str('name'))
  const email = str('email').trim()
  const subject = str('subject')
  const message = str('message').replace(/\r\n?/g, '\n').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '').trim()

  if (!name || name.length > 100) return fail(400, 'Please enter your name (up to 100 characters).')
  if (email.length > 254 || !EMAIL_RE.test(email)) return fail(400, 'Please enter a valid email address.')
  if (!(SUBJECTS as readonly string[]).includes(subject)) return fail(400, 'Please choose a topic.')
  if (message.length < 10 || message.length > 5000) return fail(400, 'Your message must be between 10 and 5,000 characters.')

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set')
    return fail(503, 'The contact form is temporarily unavailable. Please email us directly.')
  }

  const limited = await overLimit(ip, true) // only valid submissions consume a slot
  if (limited !== null) return tooMany(limited)

  // Dev-only test hook so abuse/rate-limit checks can run without sending real email. Never honoured in production.
  if (process.env.NODE_ENV !== 'production' && request.headers.get('x-contact-dry-run') === '1') return json({ ok: true, dryRun: true })

  const text = `Topic: ${subject}\nName: ${name}\nEmail: ${email}\n\n${message}\n`
  const html = `<p><strong>Topic:</strong> ${escapeHtml(subject)}<br><strong>Name:</strong> ${escapeHtml(name)}<br>` +
    `<strong>Email:</strong> ${escapeHtml(email)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`

  let res: Response
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || 'PDF and Image + <noreply@pdfandimage.com>',
        to: [process.env.CONTACT_TO_EMAIL || 'contact@pdfandimage.com'],
        reply_to: email,
        subject: oneLine(`[Contact] ${subject}: ${name}`).slice(0, 150),
        text,
        html,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    console.error('[contact] Resend network error/timeout')
    return fail(502, 'We couldn\'t send your message right now. Please try again or email us directly.')
  }

  if (!res.ok) {
    // Resend's error name/message never contain the API key; addresses are redacted so no user email reaches the logs.
    let detail = ''
    try {
      const e = (await res.json()) as { name?: unknown; message?: unknown }
      detail = `${e.name ?? ''}: ${e.message ?? ''}`.replace(/[^\s@<>]+@[^\s@<>]+/g, '<email>').slice(0, 200)
    } catch { /* non-JSON error body */ }
    const hint = [401, 403, 422].includes(res.status)
      ? ' (hint: check RESEND_API_KEY has sending access and the CONTACT_FROM_EMAIL domain is verified in Resend)'
      : ''
    console.error(`[contact] Resend status ${res.status} ${oneLine(detail)}${hint}`)
    return fail(502, 'We couldn\'t send your message right now. Please try again or email us directly.')
  }

  return json({ ok: true })
}
