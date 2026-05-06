// SnapDeploy sleeps idle containers — proxy returns 502/503 while waking (~60-90s)
const RETRY_DELAYS = [10000, 20000, 30000, 30000]

export async function gotenbergFetch(url: string, body: FormData): Promise<Response> {
  let lastRes: Response | null = null
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    const res = await fetch(url, { method: 'POST', body, cache: 'no-store' })
    if (res.ok) return res
    lastRes = res
    const isWaking = res.status === 502 || res.status === 503
    if (isWaking && attempt < RETRY_DELAYS.length) {
      await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]))
      continue
    }
    break
  }
  return lastRes!
}

export function gotenbergUrl(path: string): string {
  const base = process.env.GOTENBERG_URL
  if (!base) throw new Error('GOTENBERG_URL not configured')
  return `${base}${path}`
}

// Gotenberg v8 endpoints (note: no format suffix on libreoffice)
export const ENDPOINTS = {
  chromiumHtml: '/forms/chromium/convert/html',
  chromiumUrl:  '/forms/chromium/convert/url',
  libreoffice:  '/forms/libreoffice/convert',   // always outputs PDF
} as const

export function noLibreOffice(): Response {
  return new Response(
    JSON.stringify({ error: 'This conversion requires LibreOffice which is not available on this server.' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  )
}
