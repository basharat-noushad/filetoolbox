import Link from 'next/link'
import { Tool } from '@/types/tools'
import { getRelatedTools } from '@/lib/toolsRegistry'

export function RelatedTools({ tool }: { tool: Tool }) {
  const related = getRelatedTools(tool)
  if (related.length === 0) return null
  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {related.map(t => (
          <Link key={t.slug} href={`/${t.slug}`}
            className="border border-gray-200 rounded-xl p-4 hover:border-brand-600 hover:shadow-sm transition-all duration-200 bg-white group cursor-pointer">
            <p className="font-semibold text-gray-800 text-sm group-hover:text-brand-600 transition-colors">{t.name}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
