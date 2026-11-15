'use client'
import { LazyMotion } from 'motion/react'
import type { ReactNode } from 'react'

// Features load after hydration so motion never blocks first paint.
const load = () => import('./features').then(m => m.default)

export function MotionRoot({ children }: { children: ReactNode }) {
  return <LazyMotion features={load}>{children}</LazyMotion>
}
