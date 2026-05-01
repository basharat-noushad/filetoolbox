'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getToolsByCategory } from '@/lib/toolsRegistry'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<'pdf' | 'image' | null>(null)
  const pdfTools = getToolsByCategory('pdf')
  const imageTools = getToolsByCategory('image')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
        aria-label="Open navigation menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out md:hidden flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
          <Link href="/" onClick={() => setOpen(false)} className="hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="pdf and image +" width={150} height={38} />
          </Link>
          <button onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" aria-label="Close menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {/* PDF Section */}
          <button
            onClick={() => setSection(section === 'pdf' ? null : 'pdf')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF Tools
            </span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${section === 'pdf' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {section === 'pdf' && (
            <div className="bg-brand-50 border-y border-brand-100">
              {pdfTools.map(tool => (
                <Link key={tool.slug} href={`/${tool.slug}`} onClick={() => setOpen(false)}
                  className="block px-8 py-2.5 text-sm text-gray-700 hover:text-brand-600 hover:bg-brand-100 transition-colors cursor-pointer">
                  {tool.name}
                </Link>
              ))}
            </div>
          )}

          {/* Image Section */}
          <button
            onClick={() => setSection(section === 'image' ? null : 'image')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image Tools
            </span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${section === 'image' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {section === 'image' && (
            <div className="bg-green-50 border-y border-green-100">
              {imageTools.map(tool => (
                <Link key={tool.slug} href={`/${tool.slug}`} onClick={() => setOpen(false)}
                  className="block px-8 py-2.5 text-sm text-gray-700 hover:text-green-600 hover:bg-green-100 transition-colors cursor-pointer">
                  {tool.name}
                </Link>
              ))}
            </div>
          )}

          <div className="px-4 pt-3">
            <Link href="/" onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
              All Tools
            </Link>
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 text-xs text-gray-400">
          Free forever · No registration · Files stay private
        </div>
      </div>
    </>
  )
}
