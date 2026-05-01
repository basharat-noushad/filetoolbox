import Link from 'next/link'
import Image from 'next/image'
import { getToolsByCategory } from '@/lib/toolsRegistry'
import { MobileNav } from './MobileNav'

export function Header() {
  const pdfTools = getToolsByCategory('pdf')
  const imageTools = getToolsByCategory('image')

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <Image src="/logo.svg" alt="pdf and image +" width={180} height={45} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: 'PDF Tools', tools: pdfTools, color: 'hover:text-brand-600', bg: 'hover:bg-brand-50' },
            { label: 'Image Tools', tools: imageTools, color: 'hover:text-green-600', bg: 'hover:bg-green-50' },
          ].map(({ label, tools, color, bg }) => (
            <div key={label} className="group relative">
              <button className={`text-sm font-medium text-gray-700 ${color} flex items-center gap-1 py-1 transition-colors cursor-pointer`}>
                {label}
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  {tools.map(tool => (
                    <Link key={tool.slug} href={`/${tool.slug}`}
                      className={`block px-4 py-2 text-sm text-gray-700 ${bg} ${color} transition-colors cursor-pointer`}>
                      {tool.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            All Tools
          </Link>
        </nav>

        {/* Mobile nav (client component) */}
        <MobileNav />
      </div>
    </header>
  )
}
