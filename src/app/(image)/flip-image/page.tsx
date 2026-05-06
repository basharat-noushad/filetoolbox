import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { FlipImageClient } from './FlipImageClient'

const tool = getToolBySlug('flip-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Flip Image Online Free — Mirror Photo Horizontally or Vertically | PDF and Image +',
    description: 'Flip images horizontally or vertically online for free. Mirror any photo in one click. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Flip Image Online Free — Mirror Photo Horizontally or Vertically | PDF and Image +',
      description: 'Flip images horizontally or vertically online for free. Mirror any photo in one click. No registration required.',
    },
    twitter: {
      title: 'Flip Image Online Free — Mirror Photo Horizontally or Vertically | PDF and Image +',
      description: 'Flip images horizontally or vertically online for free. Mirror any photo in one click. No registration required.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your image by clicking "Select File" or dragging and dropping.',
  'Click "Flip Horizontal" to mirror left-right, or "Flip Vertical" to mirror top-bottom.',
  'Download your flipped image instantly.',
]

const FAQS = [
  { q: 'What is the difference between flip horizontal and vertical?', a: 'Horizontal flip mirrors the image left-to-right (like a mirror). Vertical flip mirrors it top-to-bottom (upside down).' },
  { q: 'Will the image quality be affected?', a: 'No. Flipping is lossless — image quality is preserved perfectly.' },
  { q: 'Can I flip and then rotate?', a: 'Yes. Use the Rotate Image tool after flipping. Both tools work independently in your browser.' },
  { q: 'What formats are supported?', a: 'JPG, PNG, WebP, and other common image formats are all supported.' },
]

export default function FlipImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <FlipImageClient />
    </ToolLayout>
  )
}
