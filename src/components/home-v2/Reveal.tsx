'use client'
import { m } from 'motion/react'
import { useReduceAfterMount } from './useReduce'
import type { ReactNode } from 'react'
import { EASE } from './data'

/** Scroll-reveal: fades and lifts content once as it enters the viewport. */
export function Reveal({
  children, delay = 0, className, y = 20,
}: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  const reduce = useReduceAfterMount()
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={reduce ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -40px 0px' }}
      transition={reduce ? { duration: 0 } : { duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </m.div>
  )
}
