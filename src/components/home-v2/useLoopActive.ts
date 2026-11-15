'use client'
import { useEffect, useState, type RefObject } from 'react'
import { useInView } from 'motion/react'

/** True while the element is on screen AND the tab is visible. Gate every looping animation on this. */
export function useLoopActive(ref: RefObject<Element | null>) {
  const inView = useInView(ref)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const f = () => setVisible(!document.hidden)
    f()
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [])
  return inView && visible
}
