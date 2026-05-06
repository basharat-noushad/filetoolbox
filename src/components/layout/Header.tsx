import Link from 'next/link'
import Image from 'next/image'
import { getToolsByCategory } from '@/lib/toolsRegistry'
import { MobileNav } from './MobileNav'

export function Header() {
  const pdfTools = getToolsByCategory('pdf')
  const imageTools = getToolsByCategory('image')

  return (
    <header className="bg-white border-b border-brand-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity">
          <Image src="/logo.svg" alt="PDF and Image +" width={170} height={42} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            {
              label: 'PDF Tools',
              tools: pdfTools,
              activeColor: 'text-brand-600',
              hoverBg: 'hover:bg-brand-50',
              chipBg: 'bg-brand-100 text-brand-700',
              dropBorder: 'border-brand-100',
              itemHover: 'hover:bg-brand-50 hover:text-brand-700',
            },
            {
              label: 'Image Tools',
              tools: imageTools,
              activeColor: 'text-emerald-600',
              hoverBg: 'hover:bg-emerald-50',
              chipBg: 'bg-emerald-100 text-emerald-700',
              dropBorder: 'border-emerald-100',
              itemHover: 'hover:bg-emerald-50 hover:text-emerald-700',
            },
          ].map(({ label, tools, activeColor, hoverBg, chipBg, dropBorder, itemHover }) => (
            <div key={label} className="group relative">
              <button
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 ${hoverBg} ${activeColor} rounded-lg transition-colors duration-150 cursor-pointer`}
              >
                {label}
                <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`absolute top-full left-0 mt-1 w-52 bg-white border ${dropBorder} rounded-xl shadow-lg shadow-brand-900/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 py-1`}>
                <div className="px-3 py-1.5 mb-1 flex items-center justify-between border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${chipBg}`}>{tools.length}</span>
                </div>
                {tools.map(tool => (
                  <Link key={tool.slug} href={`/${tool.slug}`}
                    className={`block px-3 py-2 text-sm text-gray-600 ${itemHover} transition-colors cursor-pointer`}>
                    {tool.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <Link href="/"
            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            All Tools
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  )
}
