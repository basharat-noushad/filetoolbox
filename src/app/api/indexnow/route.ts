import { NextRequest, NextResponse } from 'next/server'
import { tools } from '@/lib/toolsRegistry'
import { BLOG_POSTS } from '@/lib/blogPosts'

const KEY = 'vu3g3z19yfmyhkj26d19str8e3cvzz2s'
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')
const HOST = new URL(SITE_URL).hostname

const STATIC_PAGES = ['about', 'blog', 'contact', 'help', 'privacy', 'terms']

function buildUrlList(): string[] {
  return [
    // Homepage
    SITE_URL,
    // Static pages
    ...STATIC_PAGES.map(p => `${SITE_URL}/${p}`),
    // All tool pages (50+)
    ...tools.map(t => `${SITE_URL}/${t.slug}`),
    // All blog posts — was missing before
    ...BLOG_POSTS.map(p => `${SITE_URL}/blog/${p.slug}`),
  ]
}

export async function POST(request: NextRequest) {
  // Optional bearer-token guard — set INDEXNOW_SECRET in env to protect the endpoint
  const secret = process.env.INDEXNOW_SECRET
  if (secret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const urls = buildUrlList()

  const body = {
    host: HOST,
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
    breakdown: {
      homepage: 1,
      staticPages: STATIC_PAGES.length,
      toolPages: tools.length,
      blogPosts: BLOG_POSTS.length,
    },
    urls,
  })
}

export async function GET() {
  const urls = buildUrlList()
  return NextResponse.json({
    info: 'POST to this endpoint to submit all URLs to Bing/Yandex via IndexNow.',
    key: KEY,
    keyLocation: `${SITE_URL}/${KEY}.txt`,
    totalUrls: urls.length,
    breakdown: {
      homepage: 1,
      staticPages: STATIC_PAGES.length,
      toolPages: tools.length,
      blogPosts: BLOG_POSTS.length,
    },
  })
}
