import type { Metadata } from 'next'
import Link from 'next/link'
import { ToolSearchBar } from '@/components/tools/ToolSearchBar'
import { getToolBySlug } from '@/lib/toolsRegistry'

// Next serves not-found with HTTP 404; noindex keeps it out of search results.
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

const POPULAR = ['merge-pdf', 'compress-pdf', 'pdf-to-word', 'split-pdf', 'compress-image', 'resize-image', 'remove-background', 'png-to-jpg']

export default function NotFound() {
  const popular = POPULAR.map(getToolBySlug).filter((t): t is NonNullable<typeof t> => !!t)
  return (
    <main className="min-h-[60vh] bg-gray-50 px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-sm font-semibold text-brand-700 mb-2">Error 404</p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">We can&apos;t find that page</h1>
        <p className="text-gray-600 mb-8">The link may be broken or the page may have moved. Search for a tool or pick one below.</p>
        <div className="relative text-left mb-10 [&_>div>div:first-child]:border-gray-300">
          <ToolSearchBar />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular tools</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {popular.map(t => (
            <li key={t.slug}>
              <Link href={`/${t.slug}`} className="block bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm font-semibold text-gray-800 hover:border-brand-400 hover:text-brand-700 transition-colors">
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className="inline-flex items-center px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg transition-colors">
          Back to home
        </Link>
      </div>
    </main>
  )
}
