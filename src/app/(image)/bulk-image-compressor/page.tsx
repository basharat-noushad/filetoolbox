import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { BulkImageCompressorClient } from './BulkImageCompressorClient'

const tool = getToolBySlug('bulk-image-compressor')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Bulk Image Compressor Free Online — Compress Multiple Images',
    description: 'Compress multiple images at once online for free. Upload up to 20 images and download all compressed files as a ZIP. Fast batch compression.',
    keywords: tool.keywords,
    openGraph: { title: 'Bulk Image Compressor Free | PDF and Image +', description: 'Compress up to 20 images at once and download as ZIP. Free, fast, browser-based.' },
    twitter: { title: 'Bulk Image Compressor Free | PDF and Image +', description: 'Compress up to 20 images at once and download as ZIP. Free, fast, browser-based.' },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Select up to 20 images by dragging and dropping or clicking to browse.',
  'Choose your target file size per image (0.5MB, 1MB, or 2MB).',
  'Click "Compress All" to process all images and download them as a single ZIP file.',
]

const FAQS = [
  { q: 'How many images can I compress at once?', a: 'You can compress up to 20 images in a single batch. All processing happens in your browser.' },
  { q: 'What formats are supported?', a: 'JPG, PNG, and WebP images are supported. Each image is compressed individually and the output preserves the original format.' },
  { q: 'How are the files delivered?', a: 'All compressed images are packaged into a single ZIP file for easy downloading. Each file is named with a _compressed suffix.' },
  { q: 'What does the target size setting do?', a: 'It sets the maximum file size per image. The compressor reduces quality and dimensions as needed to meet the target. Larger files see more reduction.' },
]

export default function BulkImageCompressorPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <BulkImageCompressorClient />
    </ToolLayout>
  )
}
