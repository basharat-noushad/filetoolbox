'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, X, Menu, Home, BookOpen, Info } from 'lucide-react'

const PDF_TOOLS = [
  { name: 'Merge PDF',         slug: '/merge-pdf' },
  { name: 'Split PDF',         slug: '/split-pdf' },
  { name: 'Compress PDF',      slug: '/compress-pdf' },
  { name: 'PDF to Word',       slug: '/pdf-to-word' },
  { name: 'Word to PDF',       slug: '/word-to-pdf' },
  { name: 'PDF to JPG',        slug: '/pdf-to-jpg' },
  { name: 'JPG to PDF',        slug: '/jpg-to-pdf' },
  { name: 'PDF to PNG',        slug: '/pdf-to-png' },
  { name: 'PDF to Excel',      slug: '/pdf-to-excel' },
  { name: 'Excel to PDF',      slug: '/excel-to-pdf' },
  { name: 'PDF to PPT',        slug: '/pdf-to-ppt' },
  { name: 'PPT to PDF',        slug: '/ppt-to-pdf' },
  { name: 'Rotate PDF',        slug: '/rotate-pdf' },
  { name: 'Unlock PDF',        slug: '/unlock-pdf' },
  { name: 'Protect PDF',       slug: '/protect-pdf' },
  { name: 'Watermark PDF',     slug: '/add-watermark-pdf' },
  { name: 'Sign PDF',          slug: '/sign-pdf' },
  { name: 'Crop PDF',          slug: '/crop-pdf' },
  { name: 'Reorder Pages',     slug: '/reorder-pdf-pages' },
  { name: 'Delete Pages',      slug: '/delete-pdf-pages' },
  { name: 'Extract Pages',     slug: '/extract-pdf-pages' },
  { name: 'Add Page Numbers',  slug: '/add-page-numbers-pdf' },
  { name: 'OCR PDF',           slug: '/ocr-pdf' },
]

const IMAGE_TOOLS = [
  { name: 'Compress Image',       slug: '/compress-image' },
  { name: 'Resize Image',         slug: '/resize-image' },
  { name: 'Crop Image',           slug: '/crop-image' },
  { name: 'Convert to JPG',       slug: '/png-to-jpg' },
  { name: 'Convert to PNG',       slug: '/jpg-to-png' },
  { name: 'Convert to WebP',      slug: '/image-to-webp' },
  { name: 'Rotate Image',         slug: '/rotate-image' },
  { name: 'Flip Image',           slug: '/flip-image' },
  { name: 'Grayscale',            slug: '/grayscale-image' },
  { name: 'Remove Background',    slug: '/remove-background' },
  { name: 'Add Watermark',        slug: '/add-watermark-image' },
  { name: 'Add Text',             slug: '/add-text-to-image' },
  { name: 'Image to PDF',         slug: '/jpg-to-pdf' },
  { name: 'Blur Image',           slug: '/blur-image' },
  { name: 'Brightness & Contrast',slug: '/image-brightness' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<'pdf' | 'image' | null>(null)
  const close = () => { setOpen(false); setSection(null) }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={close} aria-hidden="true" />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200">
          <Link href="/" onClick={close} className="hover:opacity-80 transition-opacity">
            <Image src="/logo.svg" alt="PDF and Image +" width={140} height={36} />
          </Link>
          <button onClick={close} className="p-2 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <Link href="/" onClick={close}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Home className="w-4 h-4 text-gray-400" /> Home
          </Link>

          {/* PDF Tools */}
          <button
            onClick={() => setSection(section === 'pdf' ? null : 'pdf')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex gap-0.5">
                <span className="w-3 h-3.5 bg-brand-600 rounded-sm block" />
                <span className="w-3 h-3.5 bg-brand-300 rounded-sm block" />
              </span>
              PDF Tools
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">25</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${section === 'pdf' ? 'rotate-180' : ''}`} />
          </button>
          {section === 'pdf' && (
            <div className="bg-brand-50/60 border-y border-brand-100">
              {PDF_TOOLS.map(tool => (
                <Link key={tool.slug + tool.name} href={tool.slug} onClick={close}
                  className="block px-8 py-2 text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-100 transition-colors">
                  {tool.name}
                </Link>
              ))}
            </div>
          )}

          {/* Image Tools */}
          <button
            onClick={() => setSection(section === 'image' ? null : 'image')}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex gap-0.5">
                <span className="w-3 h-3.5 bg-emerald-500 rounded-sm block" />
                <span className="w-3 h-3.5 bg-emerald-300 rounded-sm block" />
              </span>
              Image Tools
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">25</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${section === 'image' ? 'rotate-180' : ''}`} />
          </button>
          {section === 'image' && (
            <div className="bg-emerald-50/60 border-y border-emerald-100">
              {IMAGE_TOOLS.map(tool => (
                <Link key={tool.slug + tool.name} href={tool.slug} onClick={close}
                  className="block px-8 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-100 transition-colors">
                  {tool.name}
                </Link>
              ))}
            </div>
          )}

          <Link href="/blog" onClick={close}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <BookOpen className="w-4 h-4 text-gray-400" /> Blog
          </Link>
          <Link href="/about" onClick={close}
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Info className="w-4 h-4 text-gray-400" /> About
          </Link>
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <Link href="/" onClick={close}
            className="block w-full text-center py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg transition-colors">
            All Tools
          </Link>
          <p className="text-center text-xs text-gray-400 mt-3">Free forever · No registration · 100% private</p>
        </div>
      </div>
    </>
  )
}
