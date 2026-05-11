import { NextRequest, NextResponse } from 'next/server'
import { tools } from '@/lib/toolsRegistry'

const KEY = 'vu3g3z19yfmyhkj26d19str8e3cvzz2s'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.INDEXNOW_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const STATIC_PAGES = ['about', 'blog', 'contact', 'help', 'privacy', 'terms']

  const urls = [
    SITE_URL,
    ...STATIC_PAGES.map(p => `${SITE_URL}/${p}`),
    ...tools.map(t => `${SITE_URL}/${t.slug}`),
  ]

  const body = {
    host: new URL(SITE_URL).hostname,
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    urlList: urls,
  }

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json(
      { error: 'IndexNow submission failed', status: res.status, detail: text },
      { status: 502 }
    )
  }

  return NextResponse.json({
    success: true,
    submitted: urls.length,
    urls,
  })
}

export async function GET() {
  return NextResponse.json({
    info: 'Send a POST request to this endpoint to submit all URLs to Bing IndexNow.',
    totalUrls: tools.length + 1,
    key: KEY,
  })
}
