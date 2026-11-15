import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CANONICAL_DOMAIN = 'pdfandimage.com'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  // Only production redirects: preview deployments must stay reachable on their .vercel.app URL
  // (they are noindexed via X-Robots-Tag in next.config.ts).
  if (host.endsWith('.vercel.app') && process.env.VERCEL_ENV === 'production') {
    const url = request.nextUrl.clone()
    url.host = CANONICAL_DOMAIN
    url.protocol = 'https:'
    url.port = ''
    return NextResponse.redirect(url, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
