'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { EASE, iconFor, type ToolItem } from './data'

/* ---------- mini illustrations (decorative, aria-hidden) ---------- */

function useCycle(n: number, ms: number, reduce: boolean | null) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setI(x => (x + 1) % n), ms)
    return () => clearInterval(t)
  }, [n, ms, reduce])
  return i
}

function Person({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden>
      <path d="M8 100c0-24 14-34 32-34s32 10 32 34z" fill="#374151" />
      <circle cx="40" cy="38" r="18" fill="#4b5563" />
    </svg>
  )
}

function PassportMock({ reduce }: { reduce: boolean | null }) {
  const bg = useCycle(2, 1800, reduce)
  const colors = ['#ffffff', '#7fb2ee']
  return (
    <div className="flex h-full items-center justify-center gap-5" aria-hidden>
      <m.div animate={{ backgroundColor: colors[bg] }} transition={{ duration: reduce ? 0 : 0.6 }}
        className="relative h-52 w-40 overflow-hidden rounded-lg border border-gray-300 sm:h-60 sm:w-48">
        <Person className="absolute bottom-0 left-1/2 w-32 -translate-x-1/2 sm:w-40" />
      </m.div>
      <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <m.div key={i} animate={{ backgroundColor: colors[bg] }} transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.04 }}
            className="relative h-14 w-11 overflow-hidden rounded-[3px] border border-gray-300 sm:h-16 sm:w-12">
            <Person className="absolute bottom-0 left-1/2 w-9 -translate-x-1/2" />
          </m.div>
        ))}
      </div>
    </div>
  )
}

function CompressMock({ reduce }: { reduce: boolean | null }) {
  const targets = [{ l: '100 KB', kb: 100 }, { l: '200 KB', kb: 200 }, { l: '1 MB', kb: 1000 }]
  const i = useCycle(3, 2200, reduce)
  const ratio = Math.max(targets[i].kb / 4200, 0.04)
  return (
    <div className="mx-auto flex h-full max-w-sm flex-col justify-center gap-5" aria-hidden>
      <div>
        <div className="mb-1.5 flex justify-between text-xs font-semibold text-gray-700"><span>Original (example)</span><span>4.2 MB</span></div>
        <div className="h-3 rounded-full bg-gray-300" />
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-xs font-semibold text-brand-700"><span>Target size</span><span>{targets[i].l}</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <m.div className="h-full origin-left rounded-full bg-brand-600" initial={false} animate={{ scaleX: ratio }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }} style={{ width: '100%' }} />
        </div>
      </div>
      <div className="flex gap-2">
        {targets.map((t, k) => (
          <span key={t.l} className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${k === i ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{t.l}</span>
        ))}
      </div>
    </div>
  )
}

const QR_N = 13
function qrCells(seed: number) {
  let s = seed * 9301 + 49297
  const cells: boolean[] = []
  const finder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) => r >= r0 && r < r0 + 5 && c >= c0 && c < c0 + 5
    for (const [r0, c0] of [[0, 0], [0, QR_N - 5], [QR_N - 5, 0]]) {
      if (inBox(r0, c0)) {
        const rr = r - r0, cc = c - c0
        return rr === 0 || rr === 4 || cc === 0 || cc === 4 || (rr === 2 && cc === 2)
      }
    }
    return null
  }
  for (let r = 0; r < QR_N; r++) for (let c = 0; c < QR_N; c++) {
    const f = finder(r, c)
    if (f !== null) { cells.push(f); continue }
    s = (s * 1103515245 + 12345) & 0x7fffffff
    cells.push((s >> 8) % 2 === 0)
  }
  return cells
}

function QrMock({ reduce }: { reduce: boolean | null }) {
  const types = ['Link', 'Wi-Fi', 'WhatsApp', 'UPI', 'Contact']
  const i = useCycle(types.length, 2000, reduce)
  const cells = qrCells(i + 3)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5" aria-hidden>
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${QR_N}, 1fr)` }}>
          {cells.map((on, k) => (
            <m.span key={`${i}-${k}`} initial={reduce ? false : { scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, delay: reduce ? 0 : (k % QR_N + Math.floor(k / QR_N)) * 0.012 }}
              className={`h-3 w-3 rounded-[2px] sm:h-4 sm:w-4 ${on ? 'bg-slate-900' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {types.map((t, k) => (
          <span key={t} className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${k === i ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700'}`}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function SignMock({ reduce }: { reduce: boolean | null }) {
  const loop = reduce ? { duration: 0 } : { duration: 5, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' as const, times: [0, 0.45, 0.75, 1] }
  return (
    <div className="mx-auto flex h-full max-w-xs items-center" aria-hidden>
      <div className="relative w-full rounded-lg border border-gray-300 bg-white p-5 shadow-sm">
        <div className="space-y-2.5">
          {[100, 92, 100, 78, 100, 60].map((w, i) => <div key={i} className="h-1.5 rounded-full bg-gray-200" style={{ width: `${w}%` }} />)}
        </div>
        <div className="relative mt-8 h-16 border-b-2 border-dashed border-brand-300">
          <m.svg viewBox="0 0 160 60" className="absolute -bottom-1 left-2 h-14 w-36 overflow-visible"
            animate={reduce ? { y: 0 } : { y: [-110, -110, 0, 0] }} transition={loop}>
            <m.path d="M6 40C18 8 30 54 42 26S64 8 70 34s14 18 26-6 22 10 34-4" fill="none" stroke="#4338ca" strokeWidth="3" strokeLinecap="round"
              animate={reduce ? { pathLength: 1 } : { pathLength: [0, 1, 1, 1] }} transition={loop} />
          </m.svg>
          <m.span className="absolute -bottom-6 right-0 text-[11px] font-semibold text-gray-700"
            animate={reduce ? { opacity: 1 } : { opacity: [0, 0, 1, 1] }} transition={loop}>15 Nov 2026</m.span>
        </div>
        <div className="h-5" />
      </div>
    </div>
  )
}

function BlurMock({ reduce }: { reduce: boolean | null }) {
  return (
    <div className="mx-auto flex h-full max-w-sm items-center" aria-hidden>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-sky-200">
        <m.div className="absolute inset-0"
          animate={reduce ? { filter: 'blur(0px)' } : { filter: ['blur(0px)', 'blur(8px)', 'blur(8px)', 'blur(0px)'] }}
          transition={reduce ? { duration: 0 } : { duration: 4.5, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.7, 1] }}>
          <div className="absolute right-6 top-5 h-10 w-10 rounded-full bg-amber-300" />
          <div className="absolute -left-8 bottom-0 h-28 w-56 rounded-t-full bg-emerald-400" />
          <div className="absolute -right-10 bottom-0 h-20 w-52 rounded-t-full bg-emerald-600" />
          <div className="absolute left-10 top-8 h-3 w-16 rounded-full bg-white" />
          <div className="absolute left-24 top-14 h-3 w-10 rounded-full bg-white" />
        </m.div>
        <Person className="absolute bottom-0 left-1/2 w-28 -translate-x-1/2 sm:w-32" />
      </div>
    </div>
  )
}

/* ---------- tabbed showcase ---------- */

const MOCKS: Record<string, { title: string; line: string; Mock: (p: { reduce: boolean | null }) => React.ReactElement }> = {
  'passport-photo-maker': { title: 'Passport and visa photos', line: 'Pick your country, set a white or blue background, print several on one sheet.', Mock: PassportMock },
  'compress-pdf': { title: 'Compress to a target size', line: 'Aim for 100 KB, 200 KB or 1 MB when a form refuses your file.', Mock: CompressMock },
  'qr-code-generator': { title: 'QR codes for more than links', line: 'Wi-Fi, WhatsApp, UPI, contacts and more, as PNG, SVG or PDF.', Mock: QrMock },
  'sign-pdf': { title: 'Sign a PDF', line: 'Draw or upload your signature, drag it into place and add the date.', Mock: SignMock },
  'blur-image': { title: 'Blur a photo background', line: 'On-device AI keeps the subject sharp and softens what is behind.', Mock: BlurMock },
}

export function Showcase({ items }: { items: ToolItem[] }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const tool = items[active]
  const { Mock } = MOCKS[tool.slug]
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
      <div role="tablist" aria-label="Featured tools" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((t, i) => {
          const Icon = iconFor(t.slug, t.category)
          const on = i === active
          return (
            <button key={t.slug} role="tab" aria-selected={on} onClick={() => setActive(i)}
              className="relative shrink-0 rounded-2xl border border-transparent px-4 py-3 text-left transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 max-lg:w-64 lg:w-full">
              {on && (
                <m.span layoutId="showcase-tab" aria-hidden className="absolute inset-0 rounded-2xl border border-brand-200 bg-white"
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 36 }} />
              )}
              <span className="relative flex items-start gap-3">
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${t.category === 'pdf' ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                <span>
                  <span className="block text-[15px] font-bold text-gray-900">{MOCKS[t.slug].title}</span>
                  <span className={`mt-0.5 block text-sm leading-snug text-gray-700 ${on ? '' : 'max-lg:hidden'}`}>{MOCKS[t.slug].line}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col rounded-3xl border border-brand-100 bg-white p-4 sm:p-6">
        <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-2xl bg-gray-50 p-4 sm:min-h-[340px]">
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={tool.slug} className="h-full min-h-[268px]" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }} transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}>
              <Mock reduce={reduce} />
            </m.div>
          </AnimatePresence>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-700">{tool.description.split('. ')[0].replace(/\.$/, '')}.</p>
          <Link href={`/${tool.slug}`}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
            Open tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
