import Link from 'next/link'
import Image from 'next/image'
import { NavMegaMenu } from './NavMegaMenu'
import { MobileNav } from './MobileNav'

export function Header() {
  return (
    <div className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-brand-600 text-white">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <p className="text-xs font-medium">
            🎉 All tools are free forever — no sign-up, no watermarks, no limits
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-white/80 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="text-xs text-white/80 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <header className="bg-white border-b border-gray-200 relative">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
            <div className="flex gap-0.5">
              <div className="w-4 h-5 bg-brand-600 rounded-sm" />
              <div className="w-4 h-5 bg-emerald-500 rounded-sm" />
            </div>
            <Image src="/logo.svg" alt="PDF and Image +" width={150} height={38} priority />
          </Link>

          {/* Desktop mega menu nav (client component) */}
          <NavMegaMenu />

          {/* CTA + Mobile hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden lg:inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              All Tools
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>
    </div>
  )
}
