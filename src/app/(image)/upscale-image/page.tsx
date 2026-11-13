import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { UpscaleImageClient } from './UpscaleImageClient'

const tool = getToolBySlug('upscale-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Upscale Image Online Free — 2x, 3x, 4x",
    description: "Upscale image online free to 2x, 3x or 4x resolution in your browser. Enlarges pixels without AI, so fine detail is not recreated. Saves PNG.",
    keywords: tool.keywords,
    openGraph: { title: 'Upscale Image Free Online | PDF and Image +', description: 'Increase image resolution up to 4x online for free. Browser interpolation; no AI reconstruction.' },
    twitter: { title: 'Upscale Image Free Online | PDF and Image +', description: 'Increase image resolution up to 4x online for free. Browser interpolation; no AI reconstruction.' },
    alternates: { canonical: `/${tool.slug}` },
  }, '/upscale-image')
}

const HOW_TO_STEPS = [
  'Upload the image you want to upscale.',
  'Select the scale factor: 2x, 3x, or 4x.',
  'Click "Upscale Image" and download the higher-resolution PNG.',
]

const FAQS = [
  { q: 'What upscaling method is used?', a: 'This tool uses browser interpolation via the browser Canvas API. It produces smooth results for photos and graphics.' },
  { q: 'How much larger will the file be?', a: 'A 2x upscale produces an image with 4x the pixels. A 4x upscale produces 16x the pixels. File size depends on image content and encoding.' },
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
