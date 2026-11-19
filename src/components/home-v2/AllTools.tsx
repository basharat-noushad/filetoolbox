'use client'
import { useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { ChevronRight, Search, Server, X } from 'lucide-react'
import { EASE, iconFor, LANE, type ToolItem } from './data'

type Cat = 'all' | 'pdf' | 'image'

export function AllTools({ items }: { items: ToolItem[] }) {
  const reduce = useReducedMotion()
  const inputId = useId()
  const [cat, setCat] = useState<Cat>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    const selectCategory = () => {
      const hash = window.location.hash
      if (!['#pdf-tools', '#image-tools', '#directory', ''].includes(hash)) return
      setCat(hash === '#pdf-tools' ? 'pdf' : hash === '#image-tools' ? 'image' : 'all')
      setQ('')
    }
    selectCategory()
    window.addEventListener('hashchange', selectCategory)
    return () => window.removeEventListener('hashchange', selectCategory)
  }, [])

  const counts = useMemo(() => ({
    all: items.length,
    pdf: items.filter(t => t.category === 'pdf').length,
    image: items.filter(t => t.category === 'image').length,
  }), [items])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items
      .filter(t => cat === 'all' || t.category === cat)
      .filter(t => !s || t.name.toLowerCase().includes(s) || t.slug.replace(/-/g, ' ').includes(s) || t.description.toLowerCase().includes(s))
      .sort((a, b) => (a.category === b.category ? 0 : a.category === 'pdf' ? -1 : 1))
  }, [items, cat, q])

  const tabs: { id: Cat; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'pdf', label: 'PDF' }, { id: 'image', label: 'Image' },
  ]

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Tool category" className="inline-flex w-fit rounded-full border border-gray-200 bg-white p-1">
          {tabs.map(t => {
            const on = cat === t.id
            return (
              <button key={t.id} id={t.id === 'all' ? undefined : t.id + '-tools'} role="tab" aria-selected={on}
                style={{ scrollMarginTop: '7rem' }}
                onClick={() => {
                  const hash = t.id === 'all' ? 'directory' : t.id + '-tools'
                  window.history.replaceState(window.history.state, '', '#' + hash)
                  setCat(t.id)
                  setQ('')
                }}
                className="relative rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                {on && (
                  <m.span layoutId="dir-tab" aria-hidden
                    className={`absolute inset-0 rounded-full ${t.id === 'image' ? 'bg-emerald-700' : 'bg-brand-600'}`}
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 34 }} />
                )}
                <span className={`relative ${on ? 'text-white' : 'text-gray-700'}`}>
                  {t.label} <span className={on ? 'text-white/80' : 'text-gray-600'}>{counts[t.id]}</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <label htmlFor={inputId} className="sr-only">Filter tools</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" aria-hidden />
          <input id={inputId} type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by name, e.g. QR"
            className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-600 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15" />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear filter"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-700" aria-live="polite">
        Showing {shown.length} of {items.length} tools.{' '}
        <span className="inline-flex items-center gap-1">
          <Server className="inline h-3.5 w-3.5" aria-hidden /> marks tools that process the file on a server.
        </span>
      </p>

      <m.ul layout={!reduce} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map(t => {
            const Icon = iconFor(t.slug, t.category)
            const lane = LANE[t.category]
            return (
              <m.li key={t.slug} layout={!reduce ? 'position' : false}
                initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.94 }} transition={{ duration: 0.28, ease: EASE }}>
                <Link href={`/${t.slug}`} title={t.description}
                  className={`group flex min-h-14 items-center gap-2.5 rounded-[14px] border bg-white p-2.5 transition-[border-color,box-shadow] duration-200 hover:shadow-md active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:gap-3 sm:p-3 ${lane.border}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors ${lane.chip}`}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] font-semibold leading-tight text-gray-900 sm:text-sm">{t.name}</span>
                  {t.server
                    ? <Server className="h-3.5 w-3.5 shrink-0 text-gray-600" aria-label="Processed on a server" />
                    : <ChevronRight className="hidden h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-700 sm:block" aria-hidden />}
                </Link>
              </m.li>
            )
          })}
        </AnimatePresence>
      </m.ul>

      {shown.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <p className="font-semibold text-gray-900">No tool matches “{q}”.</p>
          <p className="mt-1 text-sm text-gray-700">Try a format like “jpg”, or an action like “compress”.</p>
          <button onClick={() => { setQ(''); setCat('all') }}
            className="mt-4 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
            Reset filters
          </button>
        </div>
      )}
    </div>
  )
}
