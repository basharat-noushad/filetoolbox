import type { Metadata } from 'next'
import Link from 'next/link'
import { getToolsByCategory } from '@/lib/toolsRegistry'
import { AdBanner } from '@/components/ads/AdBanner'
import { ToolSearchBar } from '@/components/tools/ToolSearchBar'
import { tools } from '@/lib/toolsRegistry'

export const metadata: Metadata = {
  title: 'PDF and Image + — Free PDF & Image Tools Online',
  description: 'Free online tools for PDF and image files. 50+ tools — merge, compress, convert, crop, resize and more. No sign-up. Works in your browser.',
}

const PDF_ICONS: Record<string, string> = {
  'merge-pdf': 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  'compress-pdf': 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  'pdf-to-word': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'word-to-pdf': 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'split-pdf': 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
  'pdf-to-jpg': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  'jpg-to-pdf': 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  'rotate-pdf': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  'pdf-to-png': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  'delete-pdf-pages': 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
}
const IMG_ICONS: Record<string, string> = {
  'compress-image': 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  'resize-image': 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4',
  'crop-image': 'M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2',
  'png-to-jpg': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  'jpg-to-png': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  'remove-background': 'M5 3l14 14m-7-8a3 3 0 11-6 0 3 3 0 016 0zm0 0v.01M3 8l3-3m12 0l-3-3M3 16l3 3m12 0l-3 3',
  'webp-to-png': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  'rotate-image': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  'flip-image': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  'image-to-webp': 'M13 10V3L4 14h7v7l9-11h-7z',
}

const FALLBACK_PDF = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
const FALLBACK_IMG = 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'

export default function HomePage() {
  const pdfTools = getToolsByCategory('pdf')
  const imageTools = getToolsByCategory('image')

  return (
    <main className="min-h-dvh">
      {/* Hero */}
      <section className="bg-brand-900 text-white px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-800 border border-brand-700 rounded-full px-4 py-1.5 text-sm font-medium text-brand-300 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            50+ Free Tools — No Registration Required
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight tracking-tight">
            PDF & Image Tools<br />
            <span className="text-brand-400">Free, Fast & Private</span>
          </h1>
          <p className="text-lg text-brand-300 mb-10 max-w-xl mx-auto leading-relaxed">
            Merge, compress, convert, crop, resize and more. Your files never leave your browser.
          </p>
          <div className="mb-10 max-w-lg mx-auto">
            <ToolSearchBar tools={tools} />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {['No file limits', 'No watermarks', 'Files stay private', '100% free'].map(badge => (
              <span key={badge} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-800 border border-brand-700 rounded-full text-sm text-brand-300">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-b border-brand-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Secure & Private', sub: 'Files never uploaded' },
              { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Lightning Fast', sub: 'Browser-side processing' },
              { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Always Free', sub: 'No subscriptions ever' },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: '50+ Tools', sub: 'PDF & Image processing' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* PDF Tools */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">PDF Tools</h2>
                <p className="text-xs text-gray-500">{pdfTools.length} tools available</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pdfTools.map(tool => (
              <Link key={tool.slug} href={`/${tool.slug}`}
                className="group bg-white border border-brand-100 rounded-xl p-4 text-center hover:border-brand-400 hover:shadow-md hover:shadow-brand-500/10 transition-all duration-200 cursor-pointer">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-100 transition-colors">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={PDF_ICONS[tool.slug] ?? FALLBACK_PDF} />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-600 transition-colors leading-tight">{tool.name}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="my-8 flex justify-center">
          <AdBanner slot="below-tool" format="leaderboard" />
        </div>

        {/* Image Tools */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Image Tools</h2>
                <p className="text-xs text-gray-500">{imageTools.length} tools available</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {imageTools.map(tool => (
              <Link key={tool.slug} href={`/${tool.slug}`}
                className="group bg-white border border-emerald-100 rounded-xl p-4 text-center hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={IMG_ICONS[tool.slug] ?? FALLBACK_IMG} />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors leading-tight">{tool.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom CTA strip */}
        <section className="bg-brand-900 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">Start using PDF and Image + today</h2>
          <p className="text-brand-300 text-sm mb-6">No account. No credit card. No limits. Just pick a tool and go.</p>
          <Link href="#pdf-tools"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-150 text-sm cursor-pointer">
            Browse All Tools
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </section>
      </div>
    </main>
  )
}
