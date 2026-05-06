import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { RotateImageClient } from './RotateImageClient'

const tool = getToolBySlug('rotate-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Rotate Image Online Free — Rotate Photos 90° 180° 270°',
    description: 'Rotate images online for free. Rotate photos 90°, 180°, or 270°. Fix portrait/landscape orientation instantly. No registration.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Rotate Image Online Free — Rotate Photos 90° 180° 270° | PDF and Image +',
      description: 'Rotate images online for free. Rotate photos 90°, 180°, or 270°. Fix portrait/landscape orientation instantly. No registration.',
    },
    twitter: {
      title: 'Rotate Image Online Free — Rotate Photos 90° 180° 270° | PDF and Image +',
      description: 'Rotate images online for free. Rotate photos 90°, 180°, or 270°. Fix portrait/landscape orientation instantly. No registration.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your image by clicking "Select File" or dragging and dropping.',
  'Click the rotation buttons to rotate your image — a live preview updates instantly.',
  'Click "Download" when you are happy with the rotation.',
]

const FAQS = [
  { q: 'What rotation options are available?', a: 'Rotate 90° clockwise, 90° counter-clockwise, or 180°. Apply multiple rotations before downloading.' },
  { q: 'Will the image quality be affected?', a: 'No. Rotation is lossless — image quality is preserved perfectly.' },
  { q: 'What formats are supported?', a: 'JPG, PNG, WebP, and other common image formats are supported.' },
  { q: 'Why is my photo sideways?', a: 'Photos taken on mobile devices sometimes have incorrect EXIF orientation data. Rotation fixes this permanently.' },
]

export default function RotateImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <RotateImageClient />
    </ToolLayout>
  )
}
