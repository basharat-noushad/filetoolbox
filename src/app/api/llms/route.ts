import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Serves /api/llms with correct content-type headers
// Some AI crawlers prefer API routes over static files
export async function GET(_request: NextRequest) {
  try {
    const filePath = join(process.cwd(), 'public', 'llms.txt')
    const content = readFileSync(filePath, 'utf-8')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
