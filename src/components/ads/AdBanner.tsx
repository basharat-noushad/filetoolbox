'use client'
import { useEffect, useRef } from 'react'

type AdFormat = 'leaderboard' | 'rectangle' | 'rectangle-tall'
const AD_SIZES: Record<AdFormat, { w: number; h: number }> = {
  leaderboard:      { w: 728, h: 90 },
  rectangle:        { w: 300, h: 250 },
  'rectangle-tall': { w: 300, h: 600 },
}
const AD_SLOT_IDS: Record<string, string> = {
  header:       '1234567890',
  sidebar:      '0987654321',
  'below-tool': '1122334455',
  'in-result':  '5544332211',
}

export function AdBanner({ slot, format }: { slot: string; format: AdFormat }) {
  const adRef = useRef<HTMLModElement>(null)
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID
  const isConfigured = publisherId && publisherId !== 'ca-pub-XXXXXXXXXXXXXXXXX'
  const { w, h } = AD_SIZES[format]

  useEffect(() => {
    if (!isConfigured) return
    try {
      // @ts-expect-error adsbygoogle global
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch { /* suppress SSR hydration errors */ }
  }, [isConfigured])

  if (!isConfigured) {
    return (
      <div style={{ width: w, height: h, maxWidth: '100%' }}
        className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 font-medium">
        Ad slot — {w}×{h}
      </div>
    )
  }

  return (
    <ins ref={adRef} className="adsbygoogle"
      style={{ display: 'block', width: w, height: h, maxWidth: '100%' }}
      data-ad-client={publisherId}
      data-ad-slot={AD_SLOT_IDS[slot] ?? '0000000000'}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
