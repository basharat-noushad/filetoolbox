import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const title = slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return {
    title: `${title} | PDF and Image + Blog`,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    robots: { index: false },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl">✍️</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Article Coming Soon</h1>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed">
        This article is being written. Check back soon, or browse our other guides in the meantime.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Browse All Tools
        </Link>
      </div>
    </main>
  )
}
