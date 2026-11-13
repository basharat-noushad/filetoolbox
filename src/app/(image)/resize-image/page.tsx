import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ResizeImageClient } from './ResizeImageClient'

const tool = getToolBySlug('resize-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Resize Image Online Free — Set Width and Height",
    description: "Resize image online free to exact pixel dimensions. Set width, height or a preset, with an aspect ratio lock. No sign-up, runs in your browser.",
    keywords: tool.keywords,
    openGraph: {
      title: "Resize Image Online Free — Set Width and Height | PDF and Image +",
      description: "Resize image online free to exact pixel dimensions. Set width, height or a preset, with an aspect ratio lock. No sign-up, runs in your browser.",
    },
    twitter: {
      title: "Resize Image Online Free — Set Width and Height | PDF and Image +",
      description: "Resize image online free to exact pixel dimensions. Set width, height or a preset, with an aspect ratio lock. No sign-up, runs in your browser.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/resize-image')
}

const HOW_TO_STEPS = [
  'Upload your image by clicking "Select File" or dragging and dropping.',
  'Enter the target width and/or height, or choose a preset dimension.',
  'Click "Resize Image" and download your resized file.',
]

const FAQS = [
  { q: 'What formats can I resize?', a: 'JPG, PNG, WebP, and most common image formats are supported.' },
  { q: 'Will aspect ratio be maintained?', a: 'Yes, by default. You can disable aspect ratio lock to set width and height independently.' },
  { q: 'What are the preset sizes?', a: 'Presets include 1920×1080 (HD), 1280×720 (720p), 800×600, and 512×512 (square).' },
  { q: 'Will resizing reduce quality?', a: 'Enlarging beyond the original size may reduce sharpness. Reducing size is lossless in terms of quality.' },
  { q: 'What happens if I only set width without height?', a: 'With aspect ratio lock enabled (default), the height is calculated automatically to maintain the original proportions. Disable the lock to set both dimensions independently.' },
  { q: 'Will resizing reduce the file size?', a: 'Yes. Reducing pixel dimensions also reduces file size significantly. A 4000×3000 image resized to 1920×1440 will be roughly 4-6× smaller.' },
]

export default function ResizeImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ResizeImageClient />
    </ToolLayout>
  )
}
