import { ImageResponse } from 'next/og'
import { getBlogPostBySlug } from '@/lib/blogPosts'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return new ImageResponse(<div>Not found</div>, { ...size })

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1e1b4b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '64px',
        }}
      >
        <div style={{ color: '#818cf8', fontSize: 20, marginBottom: 16, fontFamily: 'sans-serif' }}>
          {post.category} — pdfandimage.com
        </div>
        <div
          style={{
            color: 'white',
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.15,
            fontFamily: 'sans-serif',
            maxWidth: 900,
          }}
        >
          {post.title}
        </div>
      </div>
    ),
    { ...size }
  )
}
