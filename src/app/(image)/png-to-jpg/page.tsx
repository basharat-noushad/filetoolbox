import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PngToJpgClient } from './PngToJpgClient'

const tool = getToolBySlug('png-to-jpg')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PNG to JPG Online Free — Convert PNG to JPEG',
    description: 'Convert PNG images to JPG format online for free. Control quality. Batch conversion supported. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'PNG to JPG Online Free — Convert PNG to JPEG | PDF and Image +',
      description: 'Convert PNG images to JPG format online for free. Control quality. Batch conversion supported. No registration required.',
    },
    twitter: {
      title: 'PNG to JPG Online Free — Convert PNG to JPEG | PDF and Image +',
      description: 'Convert PNG images to JPG format online for free. Control quality. Batch conversion supported. No registration required.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload one or more PNG images by clicking "Select Files" or dragging and dropping.',
  'Adjust the JPG quality slider to your preference.',
  'Click "Convert to JPG" and download your converted images.',
]

const FAQS = [
  { q: 'Will transparency be preserved?', a: 'JPG does not support transparency. Transparent areas will be filled with white background.' },
  { q: 'Can I convert multiple PNGs at once?', a: 'Yes. Select multiple PNG files and all will be converted. Multiple files are delivered as a ZIP.' },
  { q: 'Why convert PNG to JPG?', a: 'JPG files are typically much smaller than PNG, making them better for web use, email, and storage.' },
  { q: 'What quality setting should I use?', a: '85% quality provides an excellent balance between file size and visual quality for most uses.' },
]

export default function PngToJpgPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PngToJpgClient />
    </ToolLayout>
  )
}
