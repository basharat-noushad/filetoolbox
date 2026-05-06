import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { JpgToPngClient } from './JpgToPngClient'

const tool = getToolBySlug('jpg-to-png')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'JPG to PNG Online Free — Convert JPEG to PNG | PDF and Image +',
    description: 'Convert JPG/JPEG images to PNG format online for free. Lossless conversion with transparency support. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'JPG to PNG Online Free — Convert JPEG to PNG | PDF and Image +',
      description: 'Convert JPG/JPEG images to PNG format online for free. Lossless conversion with transparency support. No registration required.',
    },
    twitter: {
      title: 'JPG to PNG Online Free — Convert JPEG to PNG | PDF and Image +',
      description: 'Convert JPG/JPEG images to PNG format online for free. Lossless conversion with transparency support. No registration required.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload one or more JPG images by clicking "Select Files" or dragging and dropping.',
  'The conversion is lossless — no quality options needed.',
  'Click "Convert to PNG" and download your converted files.',
]

const FAQS = [
  { q: 'Why convert JPG to PNG?', a: 'PNG is lossless and supports transparency, making it better for logos, graphics, and images that need editing.' },
  { q: 'Can I convert multiple JPGs at once?', a: 'Yes. Select multiple files and all will be converted. Multiple files are delivered as a ZIP.' },
  { q: 'Will the image quality improve?', a: 'Converting JPG to PNG is lossless — quality will not degrade further. However, JPG compression artifacts already in the image will remain.' },
  { q: 'What is the output file size?', a: 'PNG files are typically larger than JPG. The exact size depends on image content and complexity.' },
]

export default function JpgToPngPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <JpgToPngClient />
    </ToolLayout>
  )
}
