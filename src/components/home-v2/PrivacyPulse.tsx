'use client'
import { useRef } from 'react'
import { FileText, Laptop } from 'lucide-react'
import { useLoopActive } from './useLoopActive'

/** On-device illustration: a file glides into the device and a soft ring pulses. Nothing ever leaves. Keyframes: .hv2-glide / .hv2-ring in page <style>. */
export function PrivacyPulse() {
  const ref = useRef<HTMLDivElement>(null)
  const run = useLoopActive(ref)
  return (
    <div ref={ref} data-run={run} aria-hidden className="pointer-events-none absolute right-6 top-6 h-24 w-40 sm:right-10 sm:top-8">
      <span className="hv2-ring absolute right-3 top-4 h-16 w-16 rounded-2xl border-2 border-brand-500" />
      <span className="hv2-glide absolute left-0 top-8 z-0 flex h-8 w-7 items-center justify-center rounded-md border border-brand-200 bg-white text-brand-600">
        <FileText className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="absolute right-3 top-4 z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-700">
        <Laptop className="h-8 w-8" strokeWidth={1.5} />
      </span>
    </div>
  )
}
