import type { Metadata } from 'next'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  FilePlus2, Scissors, FileDown, FileText, FileOutput, Image as ImageIcon,
  FileImage, Table2, FileSpreadsheet, Presentation, RotateCw, LockOpen, Lock,
  Stamp, PenLine, Crop, ArrowUpDown, Trash2, FolderOutput, Hash,
  ScanText, Layers, Archive, ImageDown, Maximize2, ArrowRightLeft, Zap, Film,
  FlipHorizontal, Contrast, Wand2, Type, Blend, Sun, ZoomIn, Smartphone,
  Code, Laugh, FolderDown, Clapperboard, MonitorPlay,
} from 'lucide-react'
import { getToolsByCategory } from '@/lib/toolsRegistry'
import { AdBanner } from '@/components/ads/AdBanner'
import { ToolSearchBar } from '@/components/tools/ToolSearchBar'

export const metadata: Metadata = {
  title: 'PDF and Image + — Free PDF & Image Tools Online',
  description: 'Free online tools for PDF and image files. 50+ tools — merge, compress, convert, crop, resize and more. No sign-up. Works in your browser.',
}

const TOOL_ICONS: Record<string, LucideIcon> = {
  // PDF
  'merge-pdf':           FilePlus2,
  'split-pdf':           Scissors,
  'compress-pdf':        FileDown,
  'pdf-to-word':         FileText,
  'word-to-pdf':         FileOutput,
  'pdf-to-jpg':          ImageIcon,
  'jpg-to-pdf':          FileImage,
  'pdf-to-png':          FileImage,
  'pdf-to-excel':        Table2,
  'excel-to-pdf':        FileSpreadsheet,
  'pdf-to-ppt':          Presentation,
  'ppt-to-pdf':          FileOutput,
  'rotate-pdf':          RotateCw,
  'unlock-pdf':          LockOpen,
  'protect-pdf':         Lock,
  'add-watermark-pdf':   Stamp,
  'sign-pdf':            PenLine,
  'crop-pdf':            Crop,
  'reorder-pdf-pages':   ArrowUpDown,
  'delete-pdf-pages':    Trash2,
  'extract-pdf-pages':   FolderOutput,
  'add-page-numbers-pdf':Hash,
  'ocr-pdf':             ScanText,
  'flatten-pdf':         Layers,
  'pdf-to-pdfa':         Archive,
  // Image
  'compress-image':      ImageDown,
  'resize-image':        Maximize2,
  'crop-image':          Crop,
  'png-to-jpg':          ArrowRightLeft,
  'jpg-to-png':          ArrowRightLeft,
  'image-to-webp':       Zap,
  'webp-to-png':         ArrowRightLeft,
  'rotate-image':        RotateCw,
  'flip-image':          FlipHorizontal,
  'grayscale-image':     Contrast,
  'remove-background':   Wand2,
  'add-watermark-image': Stamp,
  'add-text-to-image':   Type,
  'blur-image':          Blend,
  'image-brightness':    Sun,
  'upscale-image':       ZoomIn,
  'heic-to-jpg':         Smartphone,
  'svg-to-png':          FileImage,
  'image-to-base64':     Code,
  'base64-to-image':     ImageDown,
  'bulk-image-compressor':FolderDown,
  'gif-to-mp4':          Film,
  'mp4-to-gif':          Clapperboard,
  'meme-generator':      Laugh,
  'png-to-svg':          MonitorPlay,
}

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
          <div className="relative mb-4 max-w-2xl mx-auto">
            <ToolSearchBar />
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
            {pdfTools.map(tool => {
              const Icon = TOOL_ICONS[tool.slug] ?? FileText
              return (
                <Link key={tool.slug} href={`/${tool.slug}`}
                  className="group bg-white border border-brand-100 rounded-xl p-4 text-center hover:border-brand-400 hover:shadow-md hover:shadow-brand-500/10 transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-100 transition-colors">
                    <Icon className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-brand-600 transition-colors leading-tight">{tool.name}</p>
                </Link>
              )
            })}
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
            {imageTools.map(tool => {
              const Icon = TOOL_ICONS[tool.slug] ?? ImageIcon
              return (
                <Link key={tool.slug} href={`/${tool.slug}`}
                  className="group bg-white border border-emerald-100 rounded-xl p-4 text-center hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
                    <Icon className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors leading-tight">{tool.name}</p>
                </Link>
              )
            })}
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
