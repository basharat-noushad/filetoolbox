import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, ArrowRight } from 'lucide-react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com'

export const metadata: Metadata = {
  title: 'Blog — PDF & Image Tips, Tutorials and Guides | PDF and Image +',
  description: 'Tutorials, tips, and guides for working with PDF and image files. Learn how to compress, convert, merge and edit PDFs and images online for free.',
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
  publisher: {
    '@type': 'Organization',
    name: 'PDF and Image +',
    url: SITE_URL,
  },
}

type Post = {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string
  featured?: boolean
}

const POSTS: Post[] = [
  {
    slug: 'how-to-compress-pdf-without-losing-quality',
    title: 'How to Compress a PDF Without Losing Quality',
    excerpt: 'Large PDFs slow down email, cloud storage, and websites. Learn the best techniques to reduce PDF file size while keeping text sharp and images clear.',
    category: 'PDF Guide',
    readTime: '4 min read',
    date: 'May 2025',
    featured: true,
  },
  {
    slug: 'how-to-merge-pdf-files-online-free',
    title: 'How to Merge PDF Files Online for Free',
    excerpt: 'Combining multiple PDFs into one document is simple with the right tool. This step-by-step guide shows you how to merge PDFs in seconds without installing software.',
    category: 'PDF Guide',
    readTime: '3 min read',
    date: 'May 2025',
    featured: true,
  },
  {
    slug: 'pdf-to-word-conversion-tips',
    title: 'PDF to Word Conversion: Tips for the Best Results',
    excerpt: 'Converting PDFs to editable Word documents isn\'t always perfect. Here\'s what to expect and how to get the cleanest conversion for text-heavy and scanned PDFs.',
    category: 'PDF Guide',
    readTime: '5 min read',
    date: 'April 2025',
  },
  {
    slug: 'webp-vs-jpg-vs-png-which-format',
    title: 'WebP vs JPG vs PNG — Which Image Format Should You Use?',
    excerpt: 'Choosing the right image format affects file size, quality, and browser compatibility. We break down when to use WebP, JPG, and PNG for photos, graphics, and web images.',
    category: 'Image Guide',
    readTime: '6 min read',
    date: 'April 2025',
    featured: true,
  },
  {
    slug: 'how-to-remove-background-from-image-free',
    title: 'How to Remove a Background from an Image for Free',
    excerpt: 'Background removal used to require Photoshop. Today you can do it in seconds in your browser. This guide explains how AI background removal works and when to use it.',
    category: 'Image Guide',
    readTime: '4 min read',
    date: 'March 2025',
  },
  {
    slug: 'how-to-protect-pdf-with-password',
    title: 'How to Add a Password to a PDF File',
    excerpt: 'Protecting sensitive PDFs with a password takes seconds. Learn how PDF encryption works, what password strength to use, and how to share protected PDFs safely.',
    category: 'PDF Guide',
    readTime: '4 min read',
    date: 'March 2025',
  },
  {
    slug: 'compress-images-for-web-without-losing-quality',
    title: 'Compress Images for the Web Without Losing Quality',
    excerpt: 'Slow page load speeds cost you SEO rankings and users. Learn how to compress images for web use — the right format, the right dimensions, and the right compression level.',
    category: 'Image Guide',
    readTime: '5 min read',
    date: 'February 2025',
  },
  {
    slug: 'ocr-pdf-extract-text-from-scanned-documents',
    title: 'How to Extract Text from Scanned PDFs Using OCR',
    excerpt: 'Scanned PDFs are images — their text isn\'t selectable or searchable. OCR technology changes that. Here\'s how Optical Character Recognition works and how to use it.',
    category: 'PDF Guide',
    readTime: '5 min read',
    date: 'February 2025',
  },
  {
    slug: 'heic-to-jpg-convert-iphone-photos',
    title: 'How to Convert iPhone HEIC Photos to JPG',
    excerpt: 'iPhones save photos in HEIC format, which many apps and websites don\'t support. This guide shows you how to convert HEIC to JPG quickly in your browser.',
    category: 'Image Guide',
    readTime: '3 min read',
    date: 'January 2025',
  },
]

const CATEGORIES = ['All', 'PDF Guide', 'Image Guide']

const featured = POSTS.filter(p => p.featured)
const allPosts  = POSTS

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
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-brand-300 text-lg">
              Tutorials, tips, and guides for working with PDF and image files.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-14">

          {/* Featured */}
          <section className="mb-14">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Featured Articles</h2>
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
                    {post.date}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* All articles */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">All Articles</h2>
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <span
                    key={cat}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 cursor-default"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {allPosts.map(post => (
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
                      <span className="text-xs text-gray-400">{post.date}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-brand-600 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mt-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                    <ArrowRight className="w-3.5 h-3.5 ml-1 text-gray-300 group-hover:text-brand-500 transition-colors" />
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
