import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ImageToWebpClient } from './ImageToWebpClient'

const tool = getToolBySlug('image-to-webp')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Convert Image to WebP Online Free — JPG PNG to WebP | FileToolBox',
    description: 'Convert JPG or PNG images to WebP format online for free. Smaller files, better web performance. No registration required.',
    keywords: tool.keywords,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your JPG or PNG image by clicking "Select File" or dragging and dropping.',
  'Adjust the quality slider to control WebP compression.',
  'Click "Convert to WebP" and download your smaller WebP file.',
]

const FAQS = [
  { q: 'What is WebP and why use it?', a: 'WebP is a modern image format by Google that produces files 25-35% smaller than JPG and PNG with the same visual quality. Ideal for websites.' },
  { q: 'Is WebP supported everywhere?', a: 'WebP is supported by all modern browsers (Chrome, Firefox, Safari, Edge). Older browsers may not support it.' },
  { q: 'How much smaller will my WebP file be?', a: 'Typically 25-40% smaller than equivalent JPG files, and 60-80% smaller than PNG files.' },
  { q: 'Does WebP support transparency?', a: 'Yes. WebP supports transparency (alpha channel) like PNG, while still being much smaller.' },
]

export default function ImageToWebpPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ImageToWebpClient />
    </ToolLayout>
  )
}
