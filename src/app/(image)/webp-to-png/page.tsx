import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { WebpToPngClient } from './WebpToPngClient'

const tool = getToolBySlug('webp-to-png')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'WebP to PNG Online Free — Convert WebP to PNG | FileToolBox',
    description: 'Convert WebP images to PNG format online for free. Fast, lossless conversion. No registration required.',
    keywords: tool.keywords,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your WebP image by clicking "Select File" or dragging and dropping.',
  'Click "Convert to PNG" to start the conversion.',
  'Download your PNG file instantly.',
]

const FAQS = [
  { q: 'Why convert WebP to PNG?', a: 'Some older software, tools, and platforms do not support WebP format. PNG has near-universal compatibility.' },
  { q: 'Does WebP to PNG conversion lose quality?', a: 'No. The conversion preserves all quality and transparency from the WebP file.' },
  { q: 'Can I convert multiple WebP files?', a: 'This tool processes one file at a time. For batch conversion, use the tool multiple times.' },
  { q: 'Will transparency be preserved?', a: 'Yes. If the WebP file has transparency, it will be preserved in the PNG output.' },
]

export default function WebpToPngPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <WebpToPngClient />
    </ToolLayout>
  )
}
