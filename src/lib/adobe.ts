// Minimal REST client for Adobe PDF Services (no SDK).
// Docs: https://developer.adobe.com/document-services/docs/overview/pdf-services-api/gettingstarted/
// Spec: https://github.com/AdobeDocs/pdfservices-api-documentation/blob/main/static/openapi.json
// Flow: POST /token → POST /assets → PUT uploadUri → POST /operation/{op} → poll `location` → GET asset.downloadUri

import { guardUpload, reserveMonthly } from '@/lib/apiGuard'

export type AdobeErrorKind = 'NotConfigured' | 'QuotaExceeded' | 'Timeout' | 'BadInput' | 'Upstream'

export class AdobeError extends Error {
  constructor(readonly kind: AdobeErrorKind, message: string = kind) { super(message); this.name = 'AdobeError' }
}

const BUDGET_MS = 50_000 // whole conversion; route maxDuration is 60s
const STEP_MS = 20_000   // any single HTTP call

function baseUrl(): string {
  // PDF_SERVICES_BASE_URL is a test-only override (points at a local mock server).
  if (process.env.PDF_SERVICES_BASE_URL) return process.env.PDF_SERVICES_BASE_URL.replace(/\/+$/, '')
  return process.env.PDF_SERVICES_REGION === 'ew1' ? 'https://pdf-services-ew1.adobe.io' : 'https://pdf-services.adobe.io'
}

function credentials() {
  const id = process.env.PDF_SERVICES_CLIENT_ID, secret = process.env.PDF_SERVICES_CLIENT_SECRET
  return id && secret ? { id, secret } : null
}

export const adobeConfigured = () => credentials() !== null

/** One HTTP call with a timeout capped by the overall deadline. Logs only step + status. */
async function call(step: string, url: string, init: RequestInit, deadline: number): Promise<Response> {
  const left = deadline - Date.now()
  if (left <= 0) throw new AdobeError('Timeout')
  let res: Response
  try {
    res = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(Math.min(STEP_MS, left)) })
  } catch (e) {
    const timedOut = e instanceof Error && e.name === 'TimeoutError'
    console.error(`[adobe] ${step} ${timedOut ? 'timeout' : 'network error'}`)
    throw new AdobeError(timedOut ? 'Timeout' : 'Upstream')
  }
  if (!res.ok) {
    console.error(`[adobe] ${step} status ${res.status}`)
    if (res.status === 401) { token = null; throw new AdobeError('Upstream', 'unauthorized') }
    throw new AdobeError(res.status === 429 ? 'QuotaExceeded' : 'Upstream')
  }
  return res
}

// Access tokens live ~24h; cached per instance until 60s before expiry. Concurrent callers share one fetch.
let token: { value: string; exp: number } | null = null
let pendingToken: Promise<string> | null = null

async function getToken(deadline: number): Promise<string> {
  if (token && Date.now() < token.exp) return token.value
  pendingToken ??= (async () => {
    const { id, secret } = credentials()!
    const res = await call('token', `${baseUrl()}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: id, client_secret: secret }),
    }, deadline)
    const json = await res.json() as { access_token?: string; expires_in?: number | string }
    if (!json.access_token) throw new AdobeError('Upstream')
    const ttl = Number(json.expires_in) || 3600
    token = { value: json.access_token, exp: Date.now() + Math.max(0, ttl - 60) * 1000 }
    return token.value
  })().finally(() => { pendingToken = null })
  return pendingToken
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function failedJob(error: { status?: number; code?: string } | undefined): AdobeError {
  const status = Number(error?.status) || 0
  const code = String(error?.code ?? '')
  console.error(`[adobe] job failed status ${status} ${code.replace(/[^A-Z0-9_]/gi, '').slice(0, 40)}`)
  if (status === 429) return new AdobeError('QuotaExceeded')
  if (status >= 400 && status < 500) {
    return new AdobeError('BadInput', /PROTECT|ENCRYPT|PASSWORD/i.test(code)
      ? 'This file is password-protected. Please remove the password and try again.'
      : 'This file could not be converted. It may be corrupt, empty, or in an unsupported format.')
  }
  return new AdobeError('Upstream')
}

/**
 * Converts a document with Adobe PDF Services.
 * exportpdf: PDF → targetFormat (docx | xlsx | pptx). createpdf: Office file → PDF.
 * Throws AdobeError; never logs credentials, tokens, presigned URLs or file contents.
 */
/** Same origin as the configured base (covers the test mock), or an https Adobe PDF Services host. */
function isTrustedStatusUrl(u: URL, base: string): boolean {
  if (u.origin === new URL(base).origin) return true
  return u.protocol === 'https:' && /^pdf-services(-[a-z0-9]+)?\.adobe\.io$/.test(u.hostname)
}

export async function convertWithAdobe(
  op: 'exportpdf' | 'createpdf', blob: Blob, mediaType: string, targetFormat?: 'docx' | 'xlsx' | 'pptx',
): Promise<ArrayBuffer> {
  if (!credentials()) throw new AdobeError('NotConfigured')
  if (op === 'exportpdf' && !targetFormat) throw new AdobeError('BadInput', 'Missing target format.')
  const deadline = Date.now() + BUDGET_MS
  const base = baseUrl()
  try {
    const auth = async () => ({ Authorization: `Bearer ${await getToken(deadline)}`, 'x-api-key': credentials()!.id })

    const createAsset = async () => call('assets', `${base}/assets`, {
      method: 'POST',
      headers: { ...await auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaType }),
    }, deadline)
    // A cached token can be revoked early; on 401 retry once with a fresh one.
    const assetRes = await createAsset().catch(e => {
      if (e instanceof AdobeError && e.message === 'unauthorized') return createAsset()
      throw e
    })
    const asset = await assetRes.json() as { uploadUri?: string; assetID?: string }
    if (!asset.uploadUri || !asset.assetID) throw new AdobeError('Upstream')

    await call('upload', asset.uploadUri, { method: 'PUT', headers: { 'Content-Type': mediaType }, body: blob }, deadline)

    const job = await call(op, `${base}/operation/${op}`, {
      method: 'POST',
      headers: { ...await auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify(op === 'exportpdf' ? { assetID: asset.assetID, targetFormat } : { assetID: asset.assetID }),
    }, deadline)
    const location = job.headers.get('location')
    // The bearer token is sent to `location`, so it must stay on Adobe's API. Adobe answers with a
    // regional host (e.g. pdf-services-ue1.adobe.io), so allow pdf-services[-region].adobe.io over https.
    if (!location || !isTrustedStatusUrl(new URL(location, base), base)) throw new AdobeError('Upstream')
    const statusUrl = new URL(location, base).toString()

    for (let delay = 800; ; delay = Math.min(delay * 1.5, 3000)) {
      const st = await (await call('poll', statusUrl, { headers: await auth() }, deadline)).json() as {
        status?: string; asset?: { downloadUri?: string }; error?: { status?: number; code?: string }
      }
      if (st.status === 'done') {
        if (!st.asset?.downloadUri) throw new AdobeError('Upstream')
        return await (await call('download', st.asset.downloadUri, {}, deadline)).arrayBuffer()
      }
      if (st.status === 'failed') throw failedJob(st.error)
      if (st.status !== 'in progress') throw new AdobeError('Upstream')
      const left = deadline - Date.now()
      if (left <= delay) { console.error(`[adobe] ${op} timeout`); throw new AdobeError('Timeout') }
      await sleep(delay)
    }
  } catch (e) {
    if (e instanceof AdobeError) throw e
    const timedOut = e instanceof Error && e.name === 'TimeoutError'
    console.error(`[adobe] ${op} ${timedOut ? 'timeout' : 'unexpected error'}`)
    throw new AdobeError(timedOut ? 'Timeout' : 'Upstream')
  }
}

// ── Route helper shared by the 6 conversion routes ──────────────────────────

export const ADOBE_MONTHLY_KEY = 'adobe'
const monthlyLimit = () => Number(process.env.ADOBE_MONTHLY_LIMIT) || 450 // Adobe free tier: 500 transactions/month
const perIpDaily = () => Number(process.env.ADOBE_PER_IP_DAILY) || 10
const MAX_RESPONSE_BYTES = 4_400_000 // Vercel also caps function response bodies at 4.5 MB

const QUOTA_MSG = 'Our free monthly conversion limit has been reached. Please try again next month.'
const text = (body: string, status: number) => new Response(body, { status })

export async function adobeRoute(request: Request, cfg: {
  exts: string[]
  op: 'exportpdf' | 'createpdf'
  targetFormat?: 'docx' | 'xlsx' | 'pptx'
  contentType: string
  filename: string
}): Promise<Response> {
  if (!adobeConfigured()) return text('Conversion service not configured.', 503)
  const upload = await guardUpload(request, { exts: cfg.exts, bucket: 'adobe', perDay: perIpDaily() })
  if (upload instanceof Response) return upload
  // Reserve before calling Adobe (atomic; failed attempts count too, Adobe bills them).
  if (!(await reserveMonthly(ADOBE_MONTHLY_KEY, monthlyLimit()))) return text(QUOTA_MSG, 503)

  let out: ArrayBuffer
  try {
    out = await convertWithAdobe(cfg.op, upload.blob, upload.mime, cfg.targetFormat)
  } catch (e) {
    const err = e instanceof AdobeError ? e : new AdobeError('Upstream')
    switch (err.kind) {
      case 'NotConfigured': return text('Conversion service not configured.', 503)
      case 'QuotaExceeded': return text(QUOTA_MSG, 503)
      case 'Timeout': return text('The conversion took too long. Please try again, or try a smaller file.', 504)
      case 'BadInput': return text(err.message, 422)
      default: return text('Conversion failed. Please try again.', 502)
    }
  }
  if (out.byteLength > MAX_RESPONSE_BYTES) {
    return text('The converted file is larger than 4.4 MB and cannot be delivered. Please try a smaller file.', 413)
  }
  return new Response(out, {
    headers: { 'Content-Type': cfg.contentType, 'Content-Disposition': `attachment; filename="${cfg.filename}"` },
  })
}
