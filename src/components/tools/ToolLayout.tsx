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

export function ToolLayout({ tool, howToSteps, faqs, children }: ToolLayoutProps) {
  return (
    <>
      <StructuredData tool={tool} howToSteps={howToSteps} faqs={faqs} />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-2 flex justify-center">
            <AdBanner slot="header" format="leaderboard" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            <main className="flex-1 min-w-0">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{tool.name}</h1>
                <p className="text-lg text-gray-600 leading-relaxed">{tool.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {['No registration required', 'Files processed in browser', 'Free forever', '100% secure'].map(badge => (
                  <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200 font-medium">
                    ✓ {badge}
                  </span>
                ))}
              </div>
              {children}
              <div className="mt-8 flex justify-center">
                <AdBanner slot="below-tool" format="rectangle" />
              </div>
              <section className="mt-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">How to {tool.name}</h2>
                <ol className="space-y-3">
                  {howToSteps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center">
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
                    <div key={i} className="border border-gray-200 rounded-xl p-5 bg-white">
                      <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </main>
            <aside className="hidden lg:block w-[300px] flex-shrink-0">
              <div className="sticky top-24">
                <AdBanner slot="sidebar" format="rectangle-tall" />
              </div>
            </aside>
          </div>
          <RelatedTools tool={tool} />
        </div>
      </div>
    </>
  )
}
