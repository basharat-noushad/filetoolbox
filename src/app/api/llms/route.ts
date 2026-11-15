import { buildLlmsTxt } from '@/lib/llms'

// Same content as /llms.txt, for crawlers that prefer an API route.
export const dynamic = 'force-static'

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  })
}
