'use client'
import { useRef } from 'react'
import { FileText, Image as ImageIcon } from 'lucide-react'
import { useLoopActive } from './useLoopActive'

type Card = { ext: string; kind: 'pdf' | 'img' | 'doc'; pos: string; r0: number; r1: number; dy: number; t: number; d: number }

// Decorative file cards that peek out from behind the hero demo. Float keyframes live in the page <style> (.hv2-float).
const CARDS: Card[] = [
  { ext: 'PDF', kind: 'pdf', pos: '-top-7 right-8 sm:-top-8 sm:right-12', r0: 6, r1: 2, dy: -7, t: 8, d: 0 },
  { ext: 'DOCX', kind: 'doc', pos: '-bottom-6 right-10 sm:right-24', r0: -5, r1: -1, dy: 6, t: 9, d: -3 },
  { ext: 'JPG', kind: 'img', pos: 'hidden sm:flex -right-5 top-1/3', r0: 8, r1: 11, dy: -6, t: 7, d: -1.5 },
  { ext: 'PNG', kind: 'img', pos: 'hidden sm:flex -left-5 bottom-20', r0: -7, r1: -10, dy: 7, t: 10, d: -5 },
]
const TONE = { pdf: 'text-brand-700 bg-brand-50 border-brand-200', img: 'text-emerald-700 bg-emerald-50 border-emerald-200', doc: 'text-blue-700 bg-blue-50 border-blue-200' }

export function FloatingCards() {
  const ref = useRef<HTMLDivElement>(null)
  const run = useLoopActive(ref)
  return (
    <div ref={ref} data-run={run} aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {CARDS.map(c => (
        <div key={c.ext} className={`absolute flex ${c.pos}`}>
          <div
            className={`hv2-float flex h-16 w-14 flex-col items-center justify-center gap-1 rounded-xl border shadow-sm shadow-brand-900/5 ${TONE[c.kind]}`}
            style={{ '--r0': `${c.r0}deg`, '--r1': `${c.r1}deg`, '--dy': `${c.dy}px`, '--t': `${c.t}s`, '--d': `${c.d}s` } as React.CSSProperties}
          >
            {c.kind === 'img' ? <ImageIcon className="h-5 w-5" strokeWidth={1.75} /> : <FileText className="h-5 w-5" strokeWidth={1.75} />}
            <span className="text-[10px] font-bold leading-none tracking-wide">{c.ext}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
