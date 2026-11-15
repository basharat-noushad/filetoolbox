'use client'
import { useId, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { iconFor, LANE, type ToolItem } from './data'

export function HeroSearch({ items, total }: { items: ToolItem[]; total: number }) {
  const router = useRouter()
  const id = useId()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    return items
      .filter(t => t.name.toLowerCase().includes(s) || t.slug.replace(/-/g, ' ').includes(s) || t.description.toLowerCase().includes(s))
      .sort((a, b) => Number(b.name.toLowerCase().startsWith(s)) - Number(a.name.toLowerCase().startsWith(s)))
      .slice(0, 6)
  }, [q, items])

  const show = open && q.trim().length >= 2

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[idx]) { e.preventDefault(); router.push(`/${results[idx].slug}`) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">Search {total} tools</label>
      <div className="group flex items-center gap-3 rounded-2xl border border-gray-300 bg-white pl-4 pr-2 shadow-sm shadow-gray-900/5 transition-[border-color,box-shadow] hover:border-gray-400 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/15">
        <Search className="h-5 w-5 shrink-0 text-gray-500 transition-colors group-focus-within:text-brand-600" aria-hidden />
        <input
          id={id} type="search" autoComplete="off" value={q} role="combobox"
          aria-expanded={show} aria-controls={`${id}-list`} aria-autocomplete="list"
          onChange={e => { setQ(e.target.value); setIdx(0); setOpen(true) }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
          placeholder="Search tools: merge, QR, HEIC"
          className="h-14 min-w-0 flex-1 appearance-none bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-500 focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        />
        {q && (
          <button type="button" aria-label="Clear search"
            onMouseDown={e => e.preventDefault()}
            onClick={() => { setQ(''); setIdx(0) }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-600">
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      {show && (
        <ul id={`${id}-list`} role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl shadow-brand-900/10">
          {results.length === 0 && <li className="px-3 py-3 text-sm text-gray-700">No match. Browse the full list below.</li>}
          {results.map((t, i) => {
            const Icon = iconFor(t.slug, t.category)
            return (
              <li key={t.slug} role="option" aria-selected={i === idx}>
                <Link href={`/${t.slug}`} onMouseEnter={() => setIdx(i)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === idx ? 'bg-gray-100' : ''}`}>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.category === 'pdf' ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">{t.name}</span>
                    <span className={`block text-xs ${LANE[t.category].text}`}>{t.category === 'pdf' ? 'PDF tool' : 'Image tool'}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
