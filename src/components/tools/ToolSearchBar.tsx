'use client'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Search, X, FileText, ImageIcon, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react'

interface ToolEntry {
  slug: string
  name: string
  description: string
  category: 'pdf' | 'image'
}

const ALL_TOOLS: ToolEntry[] = [
  // PDF
  { slug: 'merge-pdf',           name: 'Merge PDF',          description: 'Combine multiple PDF files into one document',         category: 'pdf' },
  { slug: 'split-pdf',           name: 'Split PDF',          description: 'Split a PDF into multiple files by page range',        category: 'pdf' },
  { slug: 'compress-pdf',        name: 'Compress PDF',       description: 'Reduce PDF file size without losing quality',          category: 'pdf' },
  { slug: 'pdf-to-word',         name: 'PDF to Word',        description: 'Convert PDF to editable Word documents (.docx)',       category: 'pdf' },
  { slug: 'word-to-pdf',         name: 'Word to PDF',        description: 'Convert Word documents to PDF format',                 category: 'pdf' },
  { slug: 'pdf-to-jpg',          name: 'PDF to JPG',         description: 'Convert each PDF page to a high-quality JPG image',   category: 'pdf' },
  { slug: 'jpg-to-pdf',          name: 'JPG to PDF',         description: 'Convert JPG images to a PDF file',                    category: 'pdf' },
  { slug: 'pdf-to-png',          name: 'PDF to PNG',         description: 'Convert PDF pages to transparent PNG images',         category: 'pdf' },
  { slug: 'rotate-pdf',          name: 'Rotate PDF',         description: 'Rotate all or selected PDF pages by 90° or 180°',    category: 'pdf' },
  { slug: 'delete-pdf-pages',    name: 'Delete PDF Pages',   description: 'Remove specific pages from a PDF document',           category: 'pdf' },
  { slug: 'unlock-pdf',          name: 'Unlock PDF',         description: 'Remove password protection from PDF files',           category: 'pdf' },
  { slug: 'protect-pdf',         name: 'Protect PDF',        description: 'Add password protection to your PDF files',           category: 'pdf' },
  { slug: 'add-watermark-pdf',   name: 'Watermark PDF',      description: 'Add a text or image watermark to PDF pages',         category: 'pdf' },
  { slug: 'sign-pdf',            name: 'Sign PDF',           description: 'Electronically sign PDF documents online',            category: 'pdf' },
  { slug: 'crop-pdf',            name: 'Crop PDF',           description: 'Crop the margins and visible area of PDF pages',      category: 'pdf' },
  { slug: 'reorder-pdf-pages',   name: 'Reorder Pages',      description: 'Drag and drop to rearrange PDF pages',               category: 'pdf' },
  { slug: 'extract-pdf-pages',   name: 'Extract Pages',      description: 'Extract specific pages from a PDF as a new file',    category: 'pdf' },
  { slug: 'add-page-numbers-pdf',name: 'Add Page Numbers',   description: 'Add page numbers to your PDF document',              category: 'pdf' },
  { slug: 'ocr-pdf',             name: 'OCR PDF',            description: 'Extract text from scanned PDFs using OCR',           category: 'pdf' },
  { slug: 'pdf-to-excel',        name: 'PDF to Excel',       description: 'Convert PDF tables to editable Excel spreadsheets',  category: 'pdf' },
  { slug: 'excel-to-pdf',        name: 'Excel to PDF',       description: 'Convert Excel spreadsheets to PDF format',           category: 'pdf' },
  { slug: 'pdf-to-ppt',          name: 'PDF to PPT',         description: 'Convert PDF files to PowerPoint presentations',      category: 'pdf' },
  { slug: 'ppt-to-pdf',          name: 'PPT to PDF',         description: 'Convert PowerPoint presentations to PDF',            category: 'pdf' },
  // Image
  { slug: 'compress-image',      name: 'Compress Image',     description: 'Reduce image file size without visible quality loss', category: 'image' },
  { slug: 'resize-image',        name: 'Resize Image',       description: 'Resize images to any dimension or percentage',       category: 'image' },
  { slug: 'crop-image',          name: 'Crop Image',         description: 'Crop images with an interactive cropper tool',       category: 'image' },
  { slug: 'png-to-jpg',          name: 'PNG to JPG',         description: 'Convert PNG images to JPG format',                   category: 'image' },
  { slug: 'jpg-to-png',          name: 'JPG to PNG',         description: 'Convert JPG images to PNG with transparency',        category: 'image' },
  { slug: 'image-to-webp',       name: 'Convert to WebP',    description: 'Convert images to WebP for better web performance',  category: 'image' },
  { slug: 'rotate-image',        name: 'Rotate Image',       description: 'Rotate images 90°, 180°, or 270°',                  category: 'image' },
  { slug: 'flip-image',          name: 'Flip Image',         description: 'Flip images horizontally or vertically',             category: 'image' },
  { slug: 'grayscale-image',     name: 'Grayscale',          description: 'Convert color images to black and white',            category: 'image' },
  { slug: 'remove-background',   name: 'Remove Background',  description: 'Automatically remove background from photos with AI',category: 'image' },
  { slug: 'add-watermark-image', name: 'Add Watermark',      description: 'Add text or image watermarks to photos',             category: 'image' },
  { slug: 'add-text-to-image',   name: 'Add Text',           description: 'Add custom text overlays to images',                 category: 'image' },
  { slug: 'blur-image',          name: 'Blur Image',         description: 'Apply blur effect to entire image or selected area', category: 'image' },
  { slug: 'image-brightness',    name: 'Brightness & Contrast', description: 'Adjust image brightness, contrast, and exposure', category: 'image' },
]

const POPULAR = ['Merge PDF', 'Compress Image', 'PDF to Word', 'Remove Background', 'Split PDF', 'Resize Image', 'PDF to JPG', 'Convert to WebP']
const MAX_PER_CAT = 4

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-brand-100 text-brand-700 rounded-sm not-italic">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function ToolSearchBar() {
  const [query, setQuery]         = useState('')
  const [open, setOpen]           = useState(false)
  const [focused, setFocused]     = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [showAllPdf, setShowAllPdf]     = useState(false)
  const [showAllImage, setShowAllImage] = useState(false)
  const ref      = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return ALL_TOOLS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.slug.replace(/-/g, ' ').includes(q)
    )
  }, [query])

  const pdfResults   = results.filter(t => t.category === 'pdf')
  const imageResults = results.filter(t => t.category === 'image')

  const visiblePdf   = showAllPdf   ? pdfResults   : pdfResults.slice(0, MAX_PER_CAT)
  const visibleImage = showAllImage ? imageResults  : imageResults.slice(0, MAX_PER_CAT)
  const flatVisible  = [...visiblePdf, ...visibleImage]

  const showPopular  = focused && query.trim().length < 2
  const showResults  = open && results.length > 0
  const showEmpty    = open && query.trim().length >= 2 && results.length === 0
  const showDropdown = showPopular || showResults || showEmpty

  const clear    = useCallback(() => { setQuery(''); setActiveIdx(-1); setShowAllPdf(false); setShowAllImage(false); inputRef.current?.focus() }, [])
  const closeAll = useCallback(() => { setOpen(false); setFocused(false); setActiveIdx(-1); setShowAllPdf(false); setShowAllImage(false) }, [])

  useEffect(() => {
    setShowAllPdf(false)
    setShowAllImage(false)
    setActiveIdx(-1)
  }, [query])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) closeAll()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [closeAll])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { closeAll(); inputRef.current?.blur(); return }
    if (!showResults) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, flatVisible.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      const tool = flatVisible[activeIdx]
      if (tool) { window.location.href = `/${tool.slug}`; closeAll() }
    }
  }

  const popularTool = (name: string) => ALL_TOOLS.find(t => t.name === name)

  return (
    <div ref={ref} className="w-full">
      {/* Input */}
      <div className={`relative flex items-center bg-white rounded-2xl border-2 transition-colors duration-150 ${
        focused ? 'border-brand-500' : 'border-white/20'
      }`}>
        <Search className={`w-5 h-5 ml-4 shrink-0 transition-colors duration-150 ${focused ? 'text-brand-500' : 'text-gray-400'}`} strokeWidth={2} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          autoComplete="off"
          spellCheck={false}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1) }}
          onFocus={() => { setFocused(true); setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Search 50+ tools — merge PDF, resize image…"
          className="flex-1 h-14 px-3 bg-transparent text-gray-900 text-[15px] placeholder-gray-400 focus:outline-none"
          aria-label="Search tools"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {query ? (
          <button onClick={clear} aria-label="Clear search"
            className="mr-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <kbd className="mr-4 hidden sm:flex items-center text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono select-none">
            /
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-2 w-full max-w-2xl bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl shadow-black/10 max-h-[440px] overflow-y-auto">

          {/* Popular tools */}
          {showPopular && (
            <div className="p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                <TrendingUp className="w-3 h-3" /> Popular
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map(name => {
                  const t = popularTool(name)
                  if (!t) return null
                  return (
                    <Link key={t.slug} href={`/${t.slug}`}
                      onClick={closeAll}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium border transition-colors ${
                        t.category === 'pdf'
                          ? 'border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}>
                      {t.category === 'pdf'
                        ? <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                        : <ImageIcon className="w-3.5 h-3.5" strokeWidth={2} />}
                      {name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <div>
              {/* PDF group */}
              {pdfResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-500">
                      <FileText className="w-3 h-3" strokeWidth={2.5} /> PDF Tools
                      <span className="text-gray-400 normal-case tracking-normal font-normal">({pdfResults.length})</span>
                    </p>
                  </div>
                  {visiblePdf.map(tool => {
                    const idx = flatVisible.indexOf(tool)
                    const active = idx === activeIdx
                    return (
                      <Link key={tool.slug} href={`/${tool.slug}`}
                        onClick={() => { setQuery(''); closeAll() }}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`flex items-center gap-3 px-4 py-2.5 border-l-2 transition-all duration-100 group ${
                          active ? 'bg-brand-50 border-l-brand-500' : 'border-l-transparent hover:bg-gray-50 hover:border-l-brand-300'
                        }`}>
                        <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          active ? 'bg-brand-100' : 'bg-brand-50 group-hover:bg-brand-100'
                        }`}>
                          <FileText className="w-3.5 h-3.5 text-brand-600" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[13px] font-semibold leading-tight ${active ? 'text-brand-700' : 'text-gray-900'}`}>
                            {highlight(tool.name, query.trim())}
                          </p>
                          <p className="text-[12px] text-gray-400 truncate">{highlight(tool.description, query.trim())}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-brand-100 text-brand-600">
                          PDF
                        </span>
                      </Link>
                    )
                  })}
                  {!showAllPdf && pdfResults.length > MAX_PER_CAT && (
                    <button
                      onClick={() => setShowAllPdf(true)}
                      className="flex items-center gap-1 px-4 py-2 text-[12px] font-semibold text-brand-500 hover:text-brand-700 transition-colors w-full hover:bg-brand-50">
                      <ChevronRight className="w-3.5 h-3.5" />
                      +{pdfResults.length - MAX_PER_CAT} more PDF tools
                    </button>
                  )}
                </div>
              )}

              {/* Divider */}
              {pdfResults.length > 0 && imageResults.length > 0 && (
                <div className="mx-4 border-t border-gray-100 my-1" />
              )}

              {/* Image group */}
              {imageResults.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-4 pt-2 pb-1">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                      <ImageIcon className="w-3 h-3" strokeWidth={2.5} /> Image Tools
                      <span className="text-gray-400 normal-case tracking-normal font-normal">({imageResults.length})</span>
                    </p>
                  </div>
                  {visibleImage.map(tool => {
                    const idx = flatVisible.indexOf(tool)
                    const active = idx === activeIdx
                    return (
                      <Link key={tool.slug} href={`/${tool.slug}`}
                        onClick={() => { setQuery(''); closeAll() }}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`flex items-center gap-3 px-4 py-2.5 border-l-2 transition-all duration-100 group ${
                          active ? 'bg-emerald-50 border-l-emerald-500' : 'border-l-transparent hover:bg-gray-50 hover:border-l-emerald-300'
                        }`}>
                        <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          active ? 'bg-emerald-100' : 'bg-emerald-50 group-hover:bg-emerald-100'
                        }`}>
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[13px] font-semibold leading-tight ${active ? 'text-emerald-700' : 'text-gray-900'}`}>
                            {highlight(tool.name, query.trim())}
                          </p>
                          <p className="text-[12px] text-gray-400 truncate">{highlight(tool.description, query.trim())}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-600">
                          Image
                        </span>
                      </Link>
                    )
                  })}
                  {!showAllImage && imageResults.length > MAX_PER_CAT && (
                    <button
                      onClick={() => setShowAllImage(true)}
                      className="flex items-center gap-1 px-4 py-2 text-[12px] font-semibold text-emerald-500 hover:text-emerald-700 transition-colors w-full hover:bg-emerald-50">
                      <ChevronRight className="w-3.5 h-3.5" />
                      +{imageResults.length - MAX_PER_CAT} more image tools
                    </button>
                  )}
                </div>
              )}
              <div className="h-1.5" />
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="px-4 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-[14px] font-medium text-gray-700 mb-1">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-[12px] text-gray-400">Try &ldquo;compress&rdquo;, &ldquo;convert&rdquo;, or &ldquo;merge&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* Popular chips below input */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="text-[12px] text-brand-300 font-medium shrink-0">Popular:</span>
        {POPULAR.slice(0, 6).map(name => {
          const t = popularTool(name)
          if (!t) return null
          return (
            <Link key={t.slug} href={`/${t.slug}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[12px] text-white/80 hover:text-white transition-colors">
              {t.category === 'pdf'
                ? <FileText className="w-3 h-3" strokeWidth={2} />
                : <ImageIcon className="w-3 h-3" strokeWidth={2} />}
              {name}
            </Link>
          )
        })}
        <Link href="/" className="inline-flex items-center gap-0.5 text-[12px] text-brand-300 hover:text-brand-200 transition-colors">
          All tools <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
