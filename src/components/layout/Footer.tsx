import Link from 'next/link'
import { getToolsByCategory } from '@/lib/toolsRegistry'

export function Footer() {
  const pdfTools = getToolsByCategory('pdf')
  const imageTools = getToolsByCategory('image')

  return (
    <footer className="bg-brand-900 text-brand-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-lg text-white">PDF and Image +</span>
            </div>
            <p className="text-sm text-brand-300 leading-relaxed mb-5">
              50+ free online tools for PDF and image processing. No registration, no watermarks. Your files stay private.
            </p>
            <div className="flex flex-col gap-2">
              {[
                { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'Browser-side processing' },
                { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text: 'No account required' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-brand-400">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* PDF Tools */}
          <div>
            <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-4">PDF Tools</h3>
            <ul className="space-y-2.5">
              {pdfTools.slice(0, 6).map(tool => (
                <li key={tool.slug}>
                  <Link href={`/${tool.slug}`} className="text-sm text-brand-300 hover:text-white transition-colors cursor-pointer">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Image Tools */}
          <div>
            <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-4">Image Tools</h3>
            <ul className="space-y-2.5">
              {imageTools.slice(0, 6).map(tool => (
                <li key={tool.slug}>
                  <Link href={`/${tool.slug}`} className="text-sm text-brand-300 hover:text-white transition-colors cursor-pointer">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-4">Why PDF and Image +</h3>
            <div className="space-y-4">
              {[
                { num: '50+', label: 'Free tools' },
                { num: '100%', label: 'Private & secure' },
                { num: '0', label: 'Registration needed' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-white">{num}</div>
                  <div className="text-xs text-brand-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-brand-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-500">
          <span>© {new Date().getFullYear()} PDF and Image +. All rights reserved.</span>
          <span>Built for speed · Privacy first · Always free</span>
        </div>
      </div>
    </footer>
  )
}
