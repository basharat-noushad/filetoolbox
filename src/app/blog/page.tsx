import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { BLOG_POSTS } from '@/lib/blogPosts'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Blog — PDF & Image Tips, Tutorials and Guides | PDF and Image +',
  description: 'Tutorials, tips, and guides for working with PDF and image files. Learn how to compress, convert, merge, and edit PDFs and images online for free.',
  keywords: ['pdf tips', 'how to merge pdf', 'compress pdf guide', 'image conversion tutorial', 'pdf to word how to', 'free pdf tools guide'],
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Blog — PDF & Image Tips, Tutorials and Guides | PDF and Image +',
    description: 'Tutorials and guides for working with PDF and image files online for free.',
    url: `${SITE_URL}/blog`,
  },
}

const blogSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'PDF and Image + Blog',
  url: `${SITE_URL}/blog`,
  description: 'Tips, tutorials and guides for PDF and image processing.',
  publisher: { '@type': 'Organization', name: 'PDF and Image +', url: SITE_URL },
}

// Derived from single source of truth — blogPosts.ts
const featured = BLOG_POSTS.slice(0, 3)
const pdfPosts   = BLOG_POSTS.filter(p => p.category === 'PDF Guide')
const imagePosts = BLOG_POSTS.filter(p => p.category === 'Image Guide')

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <main>
        {/* Hero */}
        <section className="bg-brand-900 text-white py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">PDF & Image Guides</h1>
            <p className="text-brand-300 text-lg">
              Practical tutorials and tips for PDF and image tools — free, with no jargon.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-14">

          {/* Featured */}
          <section className="mb-14">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Featured Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featured.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white border border-gray-100 rounded-xl p-5 hover:border-brand-300 hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  <span className="inline-block text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full mb-3 w-fit">
                    {post.category}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-brand-600 transition-colors flex-1">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                    <span className="mx-1">·</span>
                    {formatDate(post.datePublished)}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* PDF Guides */}
          <section className="mb-14">
            <h2 className="text-lg font-bold text-gray-900 mb-6">PDF Guides</h2>
            <div className="divide-y divide-gray-100">
              {pdfPosts.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex items-start gap-4 py-5 hover:bg-gray-50 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(post.datePublished)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-brand-600 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mt-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Image Guides */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Image Guides</h2>
            <div className="divide-y divide-gray-100">
              {imagePosts.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex items-start gap-4 py-5 hover:bg-gray-50 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(post.datePublished)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-brand-600 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mt-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
