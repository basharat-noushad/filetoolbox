// Shared guard for upload API routes that proxy to paid / rate-limited backends.

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // Vercel rejects request bodies over 4.5 MB

type Magic = 'pdf' | 'zip' | 'ole' | 'png' | 'jpeg' | 'webp'

// Content type is derived from the validated extension — never from the client's file.type.
const TYPES: Record<string, { mime: string; magic: Magic }> = {
  pdf:  { mime: 'application/pdf', magic: 'pdf' },
  docx: { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', magic: 'zip' },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', magic: 'zip' },
  pptx: { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', magic: 'zip' },
  doc:  { mime: 'application/msword', magic: 'ole' },
  xls:  { mime: 'application/vnd.ms-excel', magic: 'ole' },
  ppt:  { mime: 'application/vnd.ms-powerpoint', magic: 'ole' },
  png:  { mime: 'image/png', magic: 'png' },
  jpg:  { mime: 'image/jpeg', magic: 'jpeg' },
  jpeg: { mime: 'image/jpeg', magic: 'jpeg' },
  webp: { mime: 'image/webp', magic: 'webp' },
}

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v)
const ascii = (s: string) => [...s].map(c => c.charCodeAt(0))

export function hasMagic(b: Uint8Array, magic: Magic): boolean {
  switch (magic) {
    // PDF spec allows junk before the header; readers accept %PDF- within the first 1 KB.
    case 'pdf':  return new TextDecoder('latin1').decode(b.subarray(0, 1024)).includes('%PDF-')
    case 'zip':  return startsWith(b, [0x50, 0x4b, 0x03, 0x04])
    case 'ole':  return startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
    case 'png':  return startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    case 'jpeg': return startsWith(b, [0xff, 0xd8, 0xff])
    case 'webp': return startsWith(b, ascii('RIFF')) && startsWith(b, ascii('WEBP'), 8)
  }
}

// ponytail: in-memory fixed window, per-instance only on serverless (each lambda has its own Map,
// cold starts reset it). Upgrade path: Vercel WAF rate-limit rule or Upstash Redis.
const buckets = new Map<string, { count: number; reset: number }>()
const WINDOW_MS = 60 * 60 * 1000

export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return xff || request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Returns seconds until the window resets if `key` is over `max`, else null. `consume` records a hit. */
export function rateLimit(key: string, max: number, consume: boolean, now = Date.now()): number | null {
  if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k)
  let b = buckets.get(key)
  if (!b || b.reset <= now) { b = { count: 0, reset: now + WINDOW_MS }; buckets.set(key, b) }
  if (b.count >= max) return Math.max(1, Math.ceil((b.reset - now) / 1000))
  if (consume) b.count++
  return null
}

const text = (body: string, status: number, headers?: HeadersInit) => new Response(body, { status, headers })

export interface GuardedUpload {
  form: FormData
  name: string
  mime: string
  blob: Blob // bytes re-wrapped with the server-derived content type
}

/**
 * Validates an upload before anything is sent upstream: rate limit, presence, size, extension
 * allowlist and magic bytes. Returns a ready-to-send error Response, or the validated upload.
 * Only uploads that pass validation count against the rate limit.
 */
export async function guardUpload(
  request: Request,
  opts: { exts: string[]; bucket: string; perHour: number },
): Promise<GuardedUpload | Response> {
  const key = `${opts.bucket}:${clientIp(request)}`
  const tooMany = () => {
    const retry = rateLimit(key, opts.perHour, false)
    return retry === null ? null : text(
      `Too many requests. Please try again in ${Math.ceil(retry / 60)} minute(s).`, 429,
      { 'Retry-After': String(retry) },
    )
  }
  const limited = tooMany()
  if (limited) return limited

  const tooLarge = () => text('File is too large. The maximum size for this tool is 4 MB.', 413)
  const declared = Number(request.headers.get('content-length'))
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return tooLarge() // multipart overhead allowance

  let form: FormData
  try { form = await request.formData() } catch { return text('Invalid upload.', 400) }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return text('No file provided.', 400)
  if (file.size > MAX_UPLOAD_BYTES) return tooLarge()

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const type = opts.exts.includes(ext) ? TYPES[ext] : undefined
  if (!type) return text(`Unsupported file type. Allowed: ${opts.exts.map(e => `.${e}`).join(', ')}.`, 415)

  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!hasMagic(bytes, type.magic)) return text(`This file does not look like a valid .${ext} file.`, 415)

  const limitedNow = tooMany() // re-check: concurrent requests may have filled the window meanwhile
  if (limitedNow) return limitedNow
  rateLimit(key, opts.perHour, true)

  return { form, name: file.name, mime: type.mime, blob: new Blob([bytes], { type: type.mime }) }
}

/** fetch with a timeout; network failures become 502 and timeouts 504 instead of throwing. */
export async function upstreamFetch(tag: string, url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) })
  } catch (e) {
    const timedOut = e instanceof Error && e.name === 'TimeoutError'
    console.error(`[${tag}] upstream ${timedOut ? 'timeout' : 'network error'}`)
    return text('', timedOut ? 504 : 502)
  }
}

/** Generic client-facing error for a failed upstream response. Logs only the status, never the body. */
export function upstreamError(tag: string, res: Response, message = 'Conversion failed. Please try again.'): Response {
  console.error(`[${tag}] upstream status ${res.status}`)
  if (res.status === 504) return text('The processing service took too long to respond. Please try again, or try a smaller file.', 504)
  return text(message, 502)
}
