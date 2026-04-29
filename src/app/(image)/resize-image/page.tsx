import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ResizeImageClient } from './ResizeImageClient'

const tool = getToolBySlug('resize-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Resize Image Online Free — Change Image Dimensions | FileToolBox',
    description: 'Resize images to any dimension online for free. Set width, height, or use presets. Aspect ratio lock included. No registration.',
    keywords: tool.keywords,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
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
]

export default function ResizeImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ResizeImageClient />
    </ToolLayout>
  )
}
