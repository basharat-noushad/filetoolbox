import Link from 'next/link'
import Image from 'next/image'
import {
  FileText, ImageIcon, UserX, ArrowRight,
  BookOpen, Info, Mail, HelpCircle, Lock, FileCheck,
  Cpu, Zap, CheckCircle,
} from 'lucide-react'

const PDF_LINKS = [
  { name: 'Merge PDF',        slug: '/merge-pdf' },
  { name: 'Split PDF',        slug: '/split-pdf' },
  { name: 'Compress PDF',     slug: '/compress-pdf' },
  { name: 'PDF to Word',      slug: '/pdf-to-word' },
  { name: 'PDF to JPG',       slug: '/pdf-to-jpg' },
  { name: 'Rotate PDF',       slug: '/rotate-pdf' },
  { name: 'Protect PDF',      slug: '/protect-pdf' },
  { name: 'OCR PDF',          slug: '/ocr-pdf' },
]

const IMAGE_LINKS = [
  { name: 'Compress Image',    slug: '/compress-image' },
  { name: 'Resize Image',      slug: '/resize-image' },
  { name: 'Remove Background', slug: '/remove-background' },
  { name: 'Convert to WebP',   slug: '/image-to-webp' },
  { name: 'Crop Image',        slug: '/crop-image' },
  { name: 'Grayscale',         slug: '/grayscale-image' },
  { name: 'Flip Image',        slug: '/flip-image' },
  { name: 'Add Watermark',     slug: '/add-watermark-image' },
]

const RESOURCE_LINKS = [
  { name: 'About',    slug: '/about',   Icon: Info },
  { name: 'Blog',     slug: '/blog',    Icon: BookOpen },
  { name: 'Contact',  slug: '/contact', Icon: Mail },
  { name: 'Privacy',  slug: '/privacy', Icon: Lock },
  { name: 'Terms',    slug: '/terms',   Icon: FileCheck },
  { name: 'Help',     slug: '/help',    Icon: HelpCircle },
]


const STATS = [
  { value: '50+',  label: 'Free tools',    Icon: Zap },
  { value: '0',    label: 'Sign-ups',      Icon: UserX },
  { value: '100%', label: 'Browser-based', Icon: Cpu },
]

const FEATURES = [
  'Files never leave your device',
  'No watermarks added ever',
  'Works on any browser',
  'Always free, no hidden fees',
]

export function Footer() {
  return (
    <footer className="bg-brand-900 border-t border-brand-800">

      {/* ── Stats strip ─────────────────────────────────────────── */}
      <div className="border-b border-brand-800">
        <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-3 gap-4 sm:divide-x sm:divide-brand-800">
          {STATS.map(({ value, label, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 sm:px-6 first:pl-0 last:pr-0">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-brand-400" strokeWidth={1.75} />
                <p className="text-xl font-bold text-white leading-none">{value}</p>
              </div>
              <p className="text-[12px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main body ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Col 1 — Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <div className="flex gap-0.5 shrink-0">
              <span className="w-3.5 h-4 bg-brand-500 rounded-sm block" />
              <span className="w-3.5 h-4 bg-emerald-500 rounded-sm block" />
            </div>
            <Image
              src="/logo.svg"
              alt="PDF and Image +"
              width={130}
              height={32}
              className="brightness-0 invert opacity-90"
            />
          </Link>

          <p className="text-[13px] text-slate-300 leading-relaxed mb-5 max-w-[240px]">
            50+ free tools for PDF &amp; image processing. No registration, no watermarks. Files stay private — always.
          </p>

          {/* Feature list */}
          <ul className="space-y-1.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-[12px] text-slate-400">
                <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" strokeWidth={2} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Col 2 — PDF Tools */}
        <div>
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-4">
            <FileText className="w-3 h-3" strokeWidth={2} />
            PDF Tools
          </h3>
          <ul className="space-y-1.5">
            {PDF_LINKS.map(({ name, slug }) => (
              <li key={slug}>
                <Link
                  href={slug}
                  className="text-[13px] text-slate-300 hover:text-white transition-colors duration-150"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#pdf-tools"
            className="inline-flex items-center gap-1 mt-4 text-[12px] font-semibold text-brand-400 hover:text-brand-200 transition-colors"
          >
            All 25 PDF tools <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Col 3 — Image Tools */}
        <div>
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-4">
            <ImageIcon className="w-3 h-3" strokeWidth={2} />
            Image Tools
          </h3>
          <ul className="space-y-1.5">
            {IMAGE_LINKS.map(({ name, slug }) => (
              <li key={slug}>
                <Link
                  href={slug}
                  className="text-[13px] text-slate-300 hover:text-white transition-colors duration-150"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#image-tools"
            className="inline-flex items-center gap-1 mt-4 text-[12px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            All 25 image tools <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Col 4 — Resources */}
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 mb-4">
            Resources
          </h3>
          <ul className="space-y-1.5">
            {RESOURCE_LINKS.map(({ name, slug, Icon }) => (
              <li key={slug}>
                <Link
                  href={slug}
                  className="inline-flex items-center gap-2 text-[13px] text-slate-300 hover:text-white transition-colors duration-150"
                >
                  <Icon className="w-3.5 h-3.5 text-brand-400 shrink-0" strokeWidth={1.75} />
                  {name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mini trust block */}
          <div className="mt-6 p-3 rounded-lg border border-brand-800 bg-brand-800/40">
            <p className="text-[12px] font-semibold text-slate-200 mb-1">100% Free, Forever</p>
            <p className="text-[12px] text-slate-400 leading-relaxed">
              No premium plans. No paywalls. Every tool on this site is free to use without limits.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────── */}
      <div className="border-t border-brand-800">
        <div className="max-w-7xl mx-auto px-6 h-11 flex items-center justify-between gap-4">
          <span className="text-[12px] text-slate-500">
            © {new Date().getFullYear()} PDF and Image +. All rights reserved.
          </span>
          <nav className="flex items-center gap-4" aria-label="Footer legal links">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms',   href: '/terms' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-[12px] text-slate-500 hover:text-slate-200 transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

    </footer>
  )
}
