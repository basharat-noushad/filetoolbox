'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  FilePlus2, Scissors, FileDown, FileText, FileOutput, Image as ImageIcon,
  FileImage, Table2, FileSpreadsheet, Presentation, RotateCw, LockOpen, Lock,
  Stamp, PenTool, Crop, ArrowUpDown, Trash2, FolderOutput, Hash,
  ScanText, Layers, Archive, ImageDown, Maximize2, ArrowRightLeft, Zap, Film,
  FlipHorizontal, Contrast, Wand2, Type, Blend, Sun, ZoomIn,
  Smartphone, Code, FolderDown, Clapperboard, Laugh, ChevronDown, ArrowRight,
  Home, Info, BookOpen,
} from 'lucide-react'

const PDF_TOOLS = [
  { name: 'Merge PDF',           slug: '/merge-pdf',            Icon: FilePlus2 },
  { name: 'Compress PDF',        slug: '/compress-pdf',         Icon: FileDown },
  { name: 'PDF to Word',         slug: '/pdf-to-word',          Icon: FileText },
  { name: 'Word to PDF',         slug: '/word-to-pdf',          Icon: FileOutput },
  { name: 'Split PDF',           slug: '/split-pdf',            Icon: Scissors },
  { name: 'PDF to JPG',          slug: '/pdf-to-jpg',           Icon: ImageIcon },
  { name: 'JPG to PDF',          slug: '/jpg-to-pdf',           Icon: FileImage },
  { name: 'Rotate PDF',          slug: '/rotate-pdf',           Icon: RotateCw },
  { name: 'PDF to PNG',          slug: '/pdf-to-png',           Icon: FileImage },
  { name: 'Delete PDF Pages',    slug: '/delete-pdf-pages',     Icon: Trash2 },
  { name: 'Reorder PDF Pages',   slug: '/reorder-pdf-pages',    Icon: ArrowUpDown },
  { name: 'Add Watermark to PDF',slug: '/add-watermark-pdf',    Icon: Stamp },
  { name: 'Add Page Numbers',    slug: '/add-page-numbers-pdf', Icon: Hash },
  { name: 'PDF to Excel',        slug: '/pdf-to-excel',         Icon: Table2 },
  { name: 'Excel to PDF',        slug: '/excel-to-pdf',         Icon: FileSpreadsheet },
  { name: 'PowerPoint to PDF',   slug: '/ppt-to-pdf',           Icon: FileOutput },
  { name: 'PDF to PowerPoint',   slug: '/pdf-to-ppt',           Icon: Presentation },
  { name: 'Unlock PDF',          slug: '/unlock-pdf',           Icon: LockOpen },
  { name: 'Protect PDF',         slug: '/protect-pdf',          Icon: Lock },
  { name: 'Sign PDF Online',     slug: '/sign-pdf',             Icon: PenTool },
  { name: 'OCR PDF',             slug: '/ocr-pdf',              Icon: ScanText },
  { name: 'Flatten PDF',         slug: '/flatten-pdf',          Icon: Layers },
  { name: 'Crop PDF',            slug: '/crop-pdf',             Icon: Crop },
  { name: 'Extract PDF Pages',   slug: '/extract-pdf-pages',    Icon: FolderOutput },
  { name: 'PDF to PDF/A',        slug: '/pdf-to-pdfa',          Icon: Archive },
]

const IMAGE_TOOLS = [
  { name: 'Compress Image',        slug: '/compress-image',      Icon: ImageDown },
  { name: 'Resize Image',          slug: '/resize-image',        Icon: Maximize2 },
  { name: 'Crop Image',            slug: '/crop-image',          Icon: Crop },
  { name: 'Rotate Image',          slug: '/rotate-image',        Icon: RotateCw },
  { name: 'Flip Image',            slug: '/flip-image',          Icon: FlipHorizontal },
  { name: 'PNG to JPG',            slug: '/png-to-jpg',          Icon: ArrowRightLeft },
  { name: 'JPG to PNG',            slug: '/jpg-to-png',          Icon: ArrowRightLeft },
  { name: 'WebP to PNG',           slug: '/webp-to-png',         Icon: ArrowRightLeft },
  { name: 'Convert to WebP',       slug: '/image-to-webp',       Icon: Zap },
  { name: 'HEIC to JPG',           slug: '/heic-to-jpg',         Icon: Smartphone },
  { name: 'SVG to PNG',            slug: '/svg-to-png',          Icon: FileImage },
  { name: 'PNG to SVG',            slug: '/png-to-svg',          Icon: PenTool },
  { name: 'Remove Background',     slug: '/remove-background',   Icon: Wand2 },
  { name: 'Grayscale Image',       slug: '/grayscale-image',     Icon: Contrast },
  { name: 'Blur Image',            slug: '/blur-image',          Icon: Blend },
  { name: 'Brightness & Contrast', slug: '/image-brightness',    Icon: Sun },
  { name: 'Add Watermark',         slug: '/add-watermark-image', Icon: Stamp },
  { name: 'Add Text to Image',     slug: '/add-text-to-image',   Icon: Type },
  { name: 'Upscale Image (AI)',    slug: '/upscale-image',       Icon: ZoomIn },
  { name: 'Bulk Compressor',       slug: '/bulk-image-compressor',Icon: FolderDown },
  { name: 'GIF to MP4',            slug: '/gif-to-mp4',          Icon: Film },
  { name: 'MP4 to GIF',            slug: '/mp4-to-gif',          Icon: Clapperboard },
  { name: 'Meme Generator',        slug: '/meme-generator',      Icon: Laugh },
  { name: 'Image to Base64',       slug: '/image-to-base64',     Icon: Code },
  { name: 'Base64 to Image',       slug: '/base64-to-image',     Icon: ImageDown },
]

type MenuKey = 'pdf' | 'image' | null

interface MegaMenuConfig {
  key: MenuKey
  label: string
  tools: typeof PDF_TOOLS
  viewAllHref: string
  description: string
  accentColor: string
  badgeCls: string
  iconBg: string
  iconColor: string
  cardHover: string
}

const MENUS: MegaMenuConfig[] = [
  {
    key: 'pdf',
    label: 'PDF Tools',
    tools: PDF_TOOLS,
    viewAllHref: '/#pdf-tools',
    description: 'Edit, convert, compress and manage PDF files — all free, all in your browser.',
    accentColor: 'text-brand-600',
    badgeCls: 'bg-brand-100 text-brand-700',
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand-600',
    cardHover: 'hover:bg-brand-50 hover:text-brand-700',
  },
  {
    key: 'image',
    label: 'Image Tools',
    tools: IMAGE_TOOLS,
    viewAllHref: '/#image-tools',
    description: 'Compress, resize, convert and enhance images in seconds — no upload required.',
    accentColor: 'text-emerald-600',
    badgeCls: 'bg-emerald-100 text-emerald-700',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    cardHover: 'hover:bg-emerald-50 hover:text-emerald-700',
  },
]

export function NavMegaMenu() {
  const [activeMenu, setActiveMenu] = useState<MenuKey>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openMenu = (key: MenuKey) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setActiveMenu(key)
  }

  const scheduleClose = () => {
    leaveTimer.current = setTimeout(() => setActiveMenu(null), 80)
  }

  const cancelClose = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
  }

  return (
    <>
      {/* Desktop nav links */}
      <nav className="hidden lg:flex items-center gap-1">
        <Link href="/"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>

        {MENUS.map(menu => (
          <div
            key={menu.key}
            onMouseEnter={() => openMenu(menu.key)}
            onMouseLeave={scheduleClose}
            className="relative"
          >
            <button
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeMenu === menu.key
                  ? `${menu.accentColor} bg-gray-100`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {menu.label}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu === menu.key ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        ))}

        <Link href="/blog"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <BookOpen className="w-3.5 h-3.5" />
          Blog
        </Link>
        <Link href="/about"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Info className="w-3.5 h-3.5" />
          About
        </Link>
      </nav>

      {/* Mega menu panels — full width, absolutely positioned below header */}
      {MENUS.map(menu => (
        <div
          key={menu.key}
          onMouseEnter={() => { cancelClose(); openMenu(menu.key) }}
          onMouseLeave={scheduleClose}
          className={`absolute top-full left-0 right-0 bg-white border-b border-gray-200 z-50 transition-all duration-200 origin-top ${
            activeMenu === menu.key
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 py-6 flex gap-8">
            {/* Left sidebar */}
            <div className="w-52 shrink-0 flex flex-col justify-between">
              <div>
                <p className={`text-base font-bold mb-1.5 ${menu.accentColor}`}>{menu.label}</p>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${menu.badgeCls}`}>
                  {menu.tools.length} tools
                </span>
                <p className="text-xs text-gray-500 leading-relaxed">{menu.description}</p>
              </div>
              <Link
                href={menu.viewAllHref}
                className={`inline-flex items-center gap-1 text-sm font-semibold mt-6 ${menu.accentColor} hover:underline`}
                onClick={() => setActiveMenu(null)}
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-100 shrink-0" />

            {/* Right: 4-column grid */}
            <div className="flex-1 grid grid-cols-4 gap-x-4 gap-y-1">
              {menu.tools.map(tool => (
                <Link
                  key={tool.slug + tool.name}
                  href={tool.slug}
                  onClick={() => setActiveMenu(null)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-gray-700 transition-colors ${menu.cardHover}`}
                >
                  <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md ${menu.iconBg}`}>
                    <tool.Icon className={`w-3.5 h-3.5 ${menu.iconColor}`} />
                  </span>
                  <span className="leading-tight">{tool.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
