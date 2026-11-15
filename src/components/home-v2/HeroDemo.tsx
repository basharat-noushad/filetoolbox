'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, m, useInView, useReducedMotion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import { iconFor, EASE } from './data'

type Thumb = 'lines' | 'stack' | 'photo' | 'cutout' | 'doc'
type FileView = { name: string; meta: string; ext: string; thumb: Thumb }
type Job = {
  label: string; slug: string; lane: 'pdf' | 'image'
  from: FileView; to: FileView; note: string
}

const JOBS: Job[] = [
  { label: 'Compress PDF', slug: 'compress-pdf', lane: 'pdf',
    from: { name: 'contract-scan.pdf', meta: '4.2 MB', ext: 'PDF', thumb: 'lines' },
    to: { name: 'contract-scan.pdf', meta: '1.1 MB', ext: 'PDF', thumb: 'lines' },
    note: 'Smaller file for email and upload forms.' },
  { label: 'Merge PDF', slug: 'merge-pdf', lane: 'pdf',
    from: { name: '3 PDF files', meta: '18 pages', ext: 'PDF', thumb: 'stack' },
    to: { name: 'merged.pdf', meta: '1 file, 18 pages', ext: 'PDF', thumb: 'lines' },
    note: 'Several files in, one document out.' },
  { label: 'Remove Background', slug: 'remove-background', lane: 'image',
    from: { name: 'portrait.jpg', meta: '2.8 MB', ext: 'JPG', thumb: 'photo' },
    to: { name: 'portrait.png', meta: 'Transparent', ext: 'PNG', thumb: 'cutout' },
    note: 'Keep it transparent or add a colour.' },
  { label: 'PDF to Word', slug: 'pdf-to-word', lane: 'pdf',
    from: { name: 'report.pdf', meta: '12 pages', ext: 'PDF', thumb: 'lines' },
    to: { name: 'report.docx', meta: 'Editable', ext: 'DOCX', thumb: 'doc' },
    note: 'Turn a PDF into a Word file you can edit.' },
]

const CHECKER =
  'bg-[length:10px_10px] bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%,transparent_75%,#e5e7eb_75%),linear-gradient(45deg,#e5e7eb_25%,#fff_25%,#fff_75%,#e5e7eb_75%)] [background-position:0_0,5px_5px]'

function Thumbnail({ kind }: { kind: Thumb }) {
  if (kind === 'photo' || kind === 'cutout') {
    return (
      <div className={`relative h-14 sm:h-16 w-full overflow-hidden rounded-md ${kind === 'cutout' ? CHECKER : 'bg-amber-200'}`} aria-hidden>
        {kind === 'photo' && <div className="absolute bottom-0 left-0 h-6 w-full bg-emerald-300" />}
        <div className="absolute bottom-0 left-1/2 h-9 w-11 -translate-x-1/2 rounded-t-full bg-slate-700" />
        <div className="absolute bottom-6 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full bg-slate-600" />
      </div>
    )
  }
  const bars = kind === 'doc' ? [100, 90, 100, 60, 95] : [100, 80, 100, 70, 40]
  return (
    <div className="flex h-14 sm:h-16 flex-col justify-center gap-1.5 rounded-md bg-gray-50 px-2" aria-hidden>
      {bars.map((w, i) => (
        <span key={i} className={`block h-1 rounded-full ${i === 0 ? 'bg-gray-400' : 'bg-gray-200'}`} style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

function Sheet({ file, lane, ghost, stack }: { file: FileView; lane: 'pdf' | 'image'; ghost?: boolean; stack?: boolean }) {
  const isImg = file.ext === 'JPG' || file.ext === 'PNG'
  return (
    <div className="relative">
      {stack && (
        <>
          <div className="absolute inset-0 translate-x-2 -translate-y-2 rounded-xl border border-gray-200 bg-white" aria-hidden />
          <div className="absolute inset-0 translate-x-1 -translate-y-1 rounded-xl border border-gray-200 bg-white" aria-hidden />
        </>
      )}
      <div className={`relative rounded-xl border bg-white p-2.5 sm:p-3 ${ghost ? 'border-dashed border-gray-300' : lane === 'pdf' ? 'border-brand-200' : 'border-emerald-200'}`}>
        <Thumbnail kind={file.thumb} />
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide ${isImg ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-50 text-brand-700'}`}>{file.ext}</span>
          <span className="truncate text-xs font-semibold text-gray-900">{file.name}</span>
        </div>
        <p className="mt-0.5 text-xs text-gray-600">{file.meta}</p>
      </div>
    </div>
  )
}

export function HeroDemo() {
  const reduce = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root, { margin: '0px 0px -10% 0px' })
  const [active, setActive] = useState(0)
  const [phase, setPhase] = useState<0 | 1 | 2>(2)
  const [paused, setPaused] = useState(false)
  const job = JOBS[active]
  const Icon = iconFor(job.slug, job.lane)

  // Timeline per job: input -> processing -> result -> next job.
  useEffect(() => {
    if (reduce) { setPhase(2); return }
    if (!inView || paused) return
    const ms = phase === 0 ? 700 : phase === 1 ? 1300 : 3000
    const t = setTimeout(() => {
      if (phase === 0) setPhase(1)
      else if (phase === 1) setPhase(2)
      else { setActive(a => (a + 1) % JOBS.length); setPhase(0) }
    }, ms)
    return () => clearTimeout(t)
  }, [phase, active, inView, paused, reduce])

  const pick = (i: number) => { setActive(i); setPhase(reduce ? 2 : 0) }

  return (
    <div
      ref={root}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}
      className="relative rounded-3xl border border-brand-100 bg-white p-3 sm:p-5"
    >
      <div role="tablist" aria-label="Example tools" className="flex flex-wrap gap-1.5">
        {JOBS.map((j, i) => (
          <button key={j.slug} role="tab" aria-selected={i === active} onClick={() => pick(i)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
              i === active
                ? j.lane === 'pdf' ? 'bg-brand-600 text-white' : 'bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {j.label}
          </button>
        ))}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl bg-brand-50/60 p-3 sm:p-5 [background-image:radial-gradient(rgba(79,70,229,0.14)_1px,transparent_1px)] [background-size:14px_14px]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={`in-${active}`} initial={reduce ? false : { opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -16 }} transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}>
              <Sheet file={job.from} lane={job.lane} stack={job.from.thumb === 'stack'} />
            </m.div>
          </AnimatePresence>

          <div className="flex w-14 sm:w-24 flex-col items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${job.lane === 'pdf' ? 'bg-brand-600' : 'bg-emerald-700'}`}>
              <AnimatePresence mode="wait" initial={false}>
                <m.span key={phase === 2 ? 'done' : 'work'} initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }}>
                  {phase === 2 ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Icon className="h-4 w-4" strokeWidth={2} />}
                </m.span>
              </AnimatePresence>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white">
              <m.div className={`h-full origin-left rounded-full ${job.lane === 'pdf' ? 'bg-brand-600' : 'bg-emerald-600'}`}
                initial={false} animate={{ scaleX: phase === 0 ? 0 : 1 }}
                transition={{ duration: reduce ? 0 : phase === 1 ? 1.2 : 0.01, ease: 'easeInOut' }} />
            </div>
          </div>

          <m.div initial={false}
            animate={phase === 2 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0.4, scale: 0.95, y: 4 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 20 }}>
            <Sheet file={job.to} lane={job.lane} ghost={phase !== 2} />
          </m.div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-gray-700" aria-live="polite">
          <span className="sr-only">{job.label}: </span>{job.note}
        </p>
        <Link href={`/${job.slug}`}
          className="group inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
          Open {job.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <p className="mt-2 text-xs text-gray-600">Illustration with example files. Real results depend on your file.</p>
    </div>
  )
}
