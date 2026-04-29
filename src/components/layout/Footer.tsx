import Link from 'next/link'
import { getToolsByCategory } from '@/lib/toolsRegistry'

export function Footer() {
  const pdfTools = getToolsByCategory('pdf')
  const imageTools = getToolsByCategory('image')

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl text-white mb-3">
              <svg className="w-7 h-7 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              FileToolBox
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Free online tools for PDF and image processing. No registration. No watermarks. Files stay private.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">PDF Tools</h3>
            <ul className="space-y-2">
              {pdfTools.slice(0, 5).map(tool => (
                <li key={tool.slug}>
                  <Link href={`/${tool.slug}`} className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">Image Tools</h3>
            <ul className="space-y-2">
              {imageTools.slice(0, 5).map(tool => (
                <li key={tool.slug}>
                  <Link href={`/${tool.slug}`} className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wide">Trust & Security</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Files never uploaded to servers
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                100% browser-side processing
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No account required
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Always free, no limits
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} FileToolBox. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
