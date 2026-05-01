import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { CompressImageClient } from './CompressImageClient'

const tool = getToolBySlug('compress-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Compress Image Online Free — Reduce Image File Size | FileToolBox',
    description: 'Compress images online for free without visible quality loss. Supports JPG, PNG, WebP. See before/after file size comparison.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Compress Image Online Free — Reduce Image File Size | FileToolBox',
      description: 'Compress images online for free without visible quality loss. Supports JPG, PNG, WebP. See before/after file size comparison.',
    },
    twitter: {
      title: 'Compress Image Online Free — Reduce Image File Size | FileToolBox',
      description: 'Compress images online for free without visible quality loss. Supports JPG, PNG, WebP. See before/after file size comparison.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your image by clicking "Select File" or dragging and dropping.',
  'Adjust the quality slider to control compression level (higher = better quality, larger file).',
  'Click "Compress Image" and download your optimized file.',
]

const FAQS = [
  { q: 'What image formats are supported?', a: 'JPG, JPEG, PNG, and WebP images are all supported for compression.' },
  { q: 'How much compression can I achieve?', a: 'Typically 40-80% size reduction depending on the image and quality setting, with no visible quality loss.' },
  { q: 'Will compression affect image dimensions?', a: 'No. Compression only reduces file size, not the pixel dimensions of your image.' },
  { q: 'Is there a file size limit?', a: 'No. All compression is done locally in your browser with no upload limits.' },
]

export default function CompressImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <CompressImageClient />
    </ToolLayout>
  )
}
