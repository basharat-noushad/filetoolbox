import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/blogPosts'
import { usesProcessingServer } from '@/lib/seo'
import { Tool } from '@/types/tools'
import { AdBanner } from '@/components/ads/AdBanner'
import { RelatedTools } from '@/components/tools/RelatedTools'
import { StructuredData } from '@/components/seo/StructuredData'

interface ToolLayoutProps {
  tool: Tool
  howToSteps: string[]
  faqs: { q: string; a: string }[]
  children: React.ReactNode
}

const ADS_ON = !!process.env.NEXT_PUBLIC_ADSENSE_ID && process.env.NEXT_PUBLIC_ADSENSE_ID !== 'ca-pub-XXXXXXXXXXXXXXXXX'

export function ToolLayout({ tool, howToSteps, faqs, children }: ToolLayoutProps) {
  const serverProcessing = usesProcessingServer(tool.slug)
  const guides = BLOG_POSTS.filter(post => post.relatedTool === tool.slug || post.relatedTools.includes(tool.slug))
    .sort((a, b) => Number(b.relatedTool === tool.slug) - Number(a.relatedTool === tool.slug)).slice(0, 3)
  return (
    <>
      <StructuredData tool={tool} howToSteps={howToSteps} faqs={faqs} />
      <div className="min-h-dvh bg-background">
        {ADS_ON && <div className="bg-white border-b border-brand-100">
          <div className="max-w-6xl mx-auto px-4 py-2 flex justify-center">
            <AdBanner slot="header" format="leaderboard" />
          </div>
        </div>}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            <main className="flex-1 min-w-0">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{tool.name}</h1>
                <p className="text-lg text-gray-600 leading-relaxed">{tool.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {['No registration required', serverProcessing ? 'Server processing' : 'Browser processing', 'Free to use'].map(badge => (
                  <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full border border-emerald-200 font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {badge}
                  </span>
                ))}
              </div>
              {serverProcessing && <p className="mb-6 text-sm text-gray-600 leading-relaxed">This tool uploads your selected file to a processing service. Only submit files you are comfortable sending. <Link href="/privacy" className="text-brand-700 underline">Read how files are handled</Link>.</p>}
              {children}
              <div className="mt-8 flex justify-center">
                <AdBanner slot="below-tool" format="rectangle" />
              </div>
              <section className="mt-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">How to {tool.name}</h2>
                <ol className="space-y-3">
                  {howToSteps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-gray-700 pt-0.5 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="mt-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="border border-brand-100 rounded-xl p-5 bg-white">
                      <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
              {guides.length > 0 && (
                <nav aria-label="Related guides" className="mt-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">Guides for this task</h2>
                  <ul className="space-y-2">{guides.map(post => <li key={post.slug}><Link href={`/blog/${post.slug}`} className="inline-block py-2 text-brand-700 underline underline-offset-4 leading-relaxed">{post.title}</Link></li>)}</ul>
                </nav>
              )}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-600">
                  Want a deeper guide?{' '}
                  <Link href="/blog" className="text-brand-600 hover:underline font-medium">
                    Read our PDF and Image guides →
                  </Link>
                </p>
              </div>
            </main>
            {ADS_ON && <aside className="hidden lg:block w-[300px] flex-shrink-0">
              <div className="sticky top-24">
                <AdBanner slot="sidebar" format="rectangle-tall" />
              </div>
            </aside>}
          </div>
          <RelatedTools tool={tool} />
        </div>
      </div>
    </>
  )
}
