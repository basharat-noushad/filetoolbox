import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { UpscaleImageClient } from './UpscaleImageClient'

const tool = getToolBySlug('upscale-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Upscale Image Online Free — AI Image Upscaler 4x',
    description: 'Upscale images up to 4x resolution online for free. Increase image size without losing quality using high-quality interpolation. No sign-up.',
    keywords: tool.keywords,
    openGraph: { title: 'Upscale Image Free Online | PDF and Image +', description: 'Increase image resolution up to 4x online for free. High-quality bicubic interpolation.' },
    twitter: { title: 'Upscale Image Free Online | PDF and Image +', description: 'Increase image resolution up to 4x online for free. High-quality bicubic interpolation.' },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload the image you want to upscale.',
  'Select the scale factor: 2x, 3x, or 4x.',
  'Click "Upscale Image" and download the higher-resolution PNG.',
]

const FAQS = [
  { q: 'What upscaling method is used?', a: 'This tool uses high-quality bicubic interpolation via the browser Canvas API. It produces smooth results for photos and graphics.' },
  { q: 'How much larger will the file be?', a: 'A 2x upscale produces an image with 4x the pixels. A 4x upscale produces 16x the pixels. File size increases proportionally.' },
  { q: 'Will the image look sharper?', a: 'Upscaling with interpolation makes images larger but cannot add detail that was not in the original. For best results, start with a high-quality source image.' },
  { q: 'What formats are supported?', a: 'JPG, PNG, and WebP images are supported as input. The output is always saved as PNG for maximum quality.' },
]

export default function UpscaleImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <UpscaleImageClient />
    </ToolLayout>
  )
}
