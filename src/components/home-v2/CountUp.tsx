'use client'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

export function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const reduce = useReducedMotion()
  const [v, setV] = useState(to)
  useEffect(() => {
    if (!inView || reduce) return
    setV(0)
    const c = animate(0, to, { duration: 1.2, ease: [0.16, 1, 0.3, 1], onUpdate: x => setV(Math.round(x)) })
    return () => c.stop()
  }, [inView, reduce, to])
  return <span ref={ref}>{v}</span>
}
