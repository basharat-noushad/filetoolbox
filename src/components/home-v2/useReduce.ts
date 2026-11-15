'use client'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/** Reduced-motion flag that is false during SSR and hydration, so markup always matches. */
export function useReduceAfterMount() {
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && !!reduce
}
