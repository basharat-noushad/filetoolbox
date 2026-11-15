'use client'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { iconFor, LANE, type ToolItem } from './data'
import { useLoopActive } from './useLoopActive'
import { useReduceAfterMount } from './useReduce'

const EXAMPLES = ['merge pdf', 'passport photo', 'compress to 100kb', 'pdf to word', 'qr code with logo', 'remove background']

/** Decorative typing loop (aria-hidden). The real input keeps its static placeholder for assistive tech. */
function TypeLoop() {
  const [n, setN] = useState(0)
  const [word, setWord] = useState(0)
  const [del, setDel] = useState(false)
  const text = EXAMPLES[word]
  useEffect(() => {
    let ms = del ? 35 : 75
    if (!del && n === text.length) ms = 1500
    else if (del && n === 0) ms = 350
    const t = setTimeout(() => {
      if (!del && n === text.length) setDel(true)
      else if (del && n === 0) { setDel(false); setWord(w => (w + 1) % EXAMPLES.length) }
      else setN(x => x + (del ? -1 : 1))
    }, ms)
    return () => clearTimeout(t)
  }, [n, del, text])
  return <>{text.slice(0, n)}<span className="hv2-caret ml-px inline-block h-5 w-px translate-y-1 bg-gray-600" /></>
}

export function HeroSearch({ items, total }: { items: ToolItem[]; total: number }) {
  const router = useRouter()
  const id = useId()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const run = useLoopActive(box)
  const reduce = useReduceAfterMount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const typing = mounted && !reduce && run && !focused && q === ''
  const showOverlay = mounted && !reduce && !focused && q === ''

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
    <div className="relative" ref={box}>
      <label htmlFor={id} className="sr-only">Search {total} tools</label>
      <div data-run={run} className="hv2-gborder rounded-2xl p-[1.5px] focus-within:bg-brand-600 focus-within:ring-4 focus-within:ring-brand-600/15 focus-within:[background-image:none]">
      <div className="flex items-center gap-3 rounded-[calc(1rem-1.5px)] bg-white px-4">
        <Search className="h-5 w-5 shrink-0 text-gray-600" aria-hidden />
        <div className="relative min-w-0 flex-1">
        <input
          id={id} type="search" autoComplete="off" value={q} role="combobox"
          aria-expanded={show} aria-controls={`${id}-list`} aria-autocomplete="list"
          onChange={e => { setQ(e.target.value); setIdx(0); setOpen(true) }}
          onFocus={() => { setOpen(true); setFocused(true) }} onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 120) }}
          onKeyDown={onKey}
          placeholder="Search tools: merge, QR, HEIC"
          className={`h-14 w-full min-w-0 bg-transparent text-base text-gray-900 focus:outline-none ${showOverlay ? 'placeholder:text-transparent' : 'placeholder:text-gray-600'}`}
        />
        {showOverlay && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center overflow-hidden whitespace-nowrap text-base text-gray-600">
            {typing ? <TypeLoop /> : 'Search tools: merge, QR, HEIC'}
          </span>
        )}
        </div>
      </div>
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
