'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Tool } from '@/types/tools'

interface Props {
  tools: Tool[]
}

export function ToolSearchBar({ tools }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const results = query.trim().length < 2 ? [] : tools.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.keywords.some(k => k.toLowerCase().includes(query.toLowerCase())) ||
    t.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search 50+ tools… e.g. compress PDF, resize image"
          className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 text-base shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {results.map(tool => (
            <Link
              key={tool.slug}
              href={`/${tool.slug}`}
              onClick={() => { setQuery(''); setOpen(false) }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
            >
              <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                tool.category === 'pdf' ? 'bg-brand-50 text-brand-700' : 'bg-green-50 text-green-700'
              }`}>
                {tool.category === 'pdf' ? 'PDF' : 'IMG'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-600">{tool.name}</p>
                <p className="text-xs text-gray-400 truncate">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {open && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 px-4 py-5 text-center text-sm text-gray-500">
          No tools found for <span className="font-medium text-gray-700">&ldquo;{query}&rdquo;</span>
        </div>
      )}
    </div>
  )
}
