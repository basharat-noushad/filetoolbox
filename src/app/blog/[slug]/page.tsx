import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { getBlogPostBySlug, getAllBlogSlugs, BLOG_POSTS } from '@/lib/blogPosts'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')

export function generateStaticParams() {
  return getAllBlogSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) return { title: 'Article Not Found | PDF and Image +' }
  return {
    title: `${post.metaTitle} | PDF and Image +`,
    description: post.metaDescription,
    keywords: post.keywords,
    authors: [{ name: 'PDF and Image +', url: SITE_URL }],
    openGraph: {
      type: 'article',
      title: `${post.metaTitle} | PDF and Image +`,
      description: post.metaDescription,
      url: `${SITE_URL}/blog/${slug}`,
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      section: post.category,
      tags: post.keywords,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.metaTitle} | PDF and Image +`,
      description: post.metaDescription,
    },
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getBlogPostBySlug(slug)
  if (!post) notFound()

  const postUrl = `${SITE_URL}/blog/${slug}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: { '@type': 'Organization', name: 'PDF and Image +', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'PDF and Image +',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    keywords: post.keywords.join(', '),
    articleSection: post.category,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  }

  const faqSchema = post.faqs.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      }
    : null

  const stepsSection = post.sections.find(s => s.steps && s.steps.length > 0)
  const howToSchema = stepsSection
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: post.title,
        description: post.metaDescription,
        step: stepsSection.steps!.map((text, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: `Step ${i + 1}`,
          text,
        })),
      }
    : null

  const relatedPosts = BLOG_POSTS
    .filter(p => p.slug !== slug && p.category === post.category)
    .slice(0, 3)

  const toolName = post.relatedTool
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {howToSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      )}

      <main className="max-w-2xl mx-auto px-4 py-12">

        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          All Articles
        </Link>

        <header className="mb-10">
          <span className="inline-block text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-4">
            {post.category}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{post.title}</h1>
          <p className="text-lg text-gray-600 leading-relaxed mb-5">{post.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-gray-100 pt-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={post.datePublished}>
                {new Date(post.datePublished).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </time>
            </span>
          </div>
        </header>

        <article>
          {post.sections.map((section, i) => (
            <section key={i} className="mb-8">

              {section.heading && (
                <h2 className="text-xl font-bold text-gray-900 mb-3 mt-10 first:mt-0">
                  {section.heading}
                </h2>
              )}

              {section.paragraphs?.map((para, j) => (
                <p key={j} className="text-gray-700 leading-relaxed mb-4 text-base">{para}</p>
              ))}

              {/* Numbered steps — <ol> enables How-To featured snippets */}
              {section.steps && section.steps.length > 0 && (
                <ol className="space-y-3 my-5 pl-0 list-none">
                  {section.steps.map((step, j) => (
                    <li key={j} className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                        {j + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {/* Bullet list — <ul> enables list featured snippets */}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="space-y-2 my-4 pl-0 list-none">
                  {section.bullets.map((item, j) => (
                    <li key={j} className="flex gap-2.5 items-start">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-500 mt-2.5" />
                      <span className="text-gray-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.tip && (
                <div className="bg-brand-50 border border-brand-100 rounded-xl px-5 py-4 my-5">
                  <p className="text-sm text-brand-800 leading-relaxed">
                    <span className="font-semibold">Tip: </span>{section.tip}
                  </p>
                </div>
              )}

            </section>
          ))}
        </article>

        {/* Primary tool CTA */}
        <div className="mt-10 bg-brand-900 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Try it now — free</h2>
          <p className="text-brand-300 text-sm mb-5">No registration, no file uploads to external servers, 100% private.</p>
          <Link
            href={`/${post.relatedTool}`}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Use {toolName} Tool →
          </Link>
        </div>

        {/* FAQ section + FAQPage schema injected above */}
        {post.faqs.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-5">
              {post.faqs.map((faq, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-5 bg-white">
                  <h3 className="font-semibold text-gray-900 mb-2 text-base">{faq.q}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related tool chips — FIX: renamed inner variable to toolSlug to avoid
            shadowing the outer `slug` from await params                          */}
        {post.relatedTools.length > 0 && (
          <section className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">Related tools</p>
            <div className="flex flex-wrap gap-2">
              {post.relatedTools.map(toolSlug => (
                <Link
                  key={toolSlug}
                  href={`/${toolSlug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  {toolSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-10 pt-6 border-t border-gray-100">
            <h2 className="text-base font-bold text-gray-900 mb-4">Related Articles</h2>
            <div className="space-y-3">
              {relatedPosts.map(related => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="flex items-start gap-3 group hover:bg-gray-50 rounded-xl p-3 -mx-3 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors leading-snug">
                      {related.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {related.readTime}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <Link href="/blog" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
            ← Back to all articles
          </Link>
        </div>

      </main>
    </>
  )
}
