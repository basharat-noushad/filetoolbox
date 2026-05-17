import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { WebpToPngClient } from './WebpToPngClient'

const tool = getToolBySlug('webp-to-png')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'WebP to PNG Online Free — Convert WebP to PNG',
    description: 'Convert WebP images to PNG format online for free. Fast, lossless conversion. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'WebP to PNG Online Free — Convert WebP to PNG | PDF and Image +',
      description: 'Convert WebP images to PNG format online for free. Fast, lossless conversion. No registration required.',
    },
    twitter: {
      title: 'WebP to PNG Online Free — Convert WebP to PNG | PDF and Image +',
      description: 'Convert WebP images to PNG format online for free. Fast, lossless conversion. No registration required.',
    },
    alternates: { canonical: `/${tool.slug}` },
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
  { q: 'Why is my PNG file larger than the original WebP?', a: 'WebP uses advanced lossy or lossless compression that is more efficient than PNG. The PNG format stores pixel data with less compression, resulting in larger files — but with universal compatibility.' },
]

export default function WebpToPngPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <WebpToPngClient />
    </ToolLayout>
  )
}
