import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ResizeImageClient } from './ResizeImageClient'

const tool = getToolBySlug('resize-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Resize Image Online Free — Change Image Dimensions',
    description: 'Resize images to any dimension online for free. Set width, height, or use presets. Aspect ratio lock included. No registration.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Resize Image Online Free — Change Image Dimensions | PDF and Image +',
      description: 'Resize images to any dimension online for free. Set width, height, or use presets. Aspect ratio lock included. No registration.',
    },
    twitter: {
      title: 'Resize Image Online Free — Change Image Dimensions | PDF and Image +',
      description: 'Resize images to any dimension online for free. Set width, height, or use presets. Aspect ratio lock included. No registration.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
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
