'use client'
import Link from 'next/link'
import { m } from 'motion/react'
import { useReduceAfterMount } from './useReduce'
import { ArrowUpRight } from 'lucide-react'
import { EASE, iconFor, type ToolItem } from './data'

// Bento on lg (4 cols): merge 2x2, passport 2x1, six singles = exactly 8 cells.
const SPAN: Record<string, string> = {
  'merge-pdf': 'lg:col-span-2 lg:row-span-2',
  'passport-photo-maker': 'lg:col-span-2',
}

export function PopularTools({ items }: { items: ToolItem[] }) {
  const reduce = useReduceAfterMount()
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(150px,auto)]">
      {items.map((t, i) => {
        const Icon = iconFor(t.slug, t.category)
        const feature = t.slug === 'merge-pdf' || t.slug === 'passport-photo-maker'
        const solid = t.slug === 'merge-pdf' ? 'bg-brand-600 text-white border-brand-600'
          : t.slug === 'passport-photo-maker' ? 'bg-emerald-700 text-white border-emerald-700' : ''
        const lane = t.category === 'pdf'
          ? 'bg-white border-brand-100 hover:border-brand-400 hover:shadow-md hover:shadow-brand-500/10'
          : 'bg-white border-emerald-100 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10'
        return (
          <m.li key={t.slug}
            className={`${SPAN[t.slug] ?? ''} ${t.slug === 'merge-pdf' ? 'sm:col-span-2' : ''}`}
            initial={{ opacity: 0, y: 24 }}
            animate={reduce ? { opacity: 1, y: 0 } : undefined}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={reduce ? { duration: 0 } : { duration: 0.55, delay: (i % 4) * 0.06, ease: EASE }}
            whileHover={reduce ? undefined : { y: -3 }}
            whileTap={reduce ? undefined : { scale: 0.985 }}>
            <Link href={`/${t.slug}`}
              className={`group relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden rounded-[17px] border p-5 transition-[border-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${solid || lane}`}>
              <Icon aria-hidden strokeWidth={1.25}
                className={`pointer-events-none absolute -bottom-4 -right-3 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105 ${feature ? 'h-44 w-44 text-white/15' : `h-28 w-28 ${t.category === 'pdf' ? 'text-brand-100' : 'text-emerald-100'}`}`} />
              <div className="relative flex items-start justify-between gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${feature ? 'bg-white/15 text-white' : t.category === 'pdf' ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <ArrowUpRight className={`h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${feature ? 'text-white' : 'text-gray-700'}`} aria-hidden />
              </div>
              <div className="relative mt-6">
                <h3 className={`font-bold leading-tight ${t.slug === 'merge-pdf' ? 'text-2xl sm:text-3xl' : 'text-lg'} ${feature ? 'text-white' : 'text-gray-900'}`}>{t.name}</h3>
                <p className={`mt-1.5 max-w-[34ch] text-sm leading-snug ${t.slug === 'merge-pdf' ? 'line-clamp-4' : 'line-clamp-2'} ${feature ? 'text-white/90' : 'text-gray-700'}`}>{t.description}</p>
              </div>
            </Link>
          </m.li>
        )
      })}
    </ul>
  )
}
