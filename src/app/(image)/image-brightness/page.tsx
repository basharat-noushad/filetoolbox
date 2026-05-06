import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ImageBrightnessClient } from './ImageBrightnessClient'

const tool = getToolBySlug('image-brightness')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Adjust Image Brightness & Contrast Online Free',
    description: 'Adjust brightness, contrast, and saturation of images online for free. Fine-tune your photos with simple sliders. Instant, no registration.',
    keywords: tool.keywords,
    openGraph: { title: 'Adjust Image Brightness & Contrast Free | PDF and Image +', description: 'Adjust brightness, contrast, and saturation of images online for free with simple sliders.' },
    twitter: { title: 'Adjust Image Brightness & Contrast Free | PDF and Image +', description: 'Adjust brightness, contrast, and saturation of images online for free with simple sliders.' },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your image by dragging and dropping or clicking to browse.',
  'Adjust the Brightness, Contrast, and Saturation sliders to your preference.',
  'Click "Apply Adjustments" and download your enhanced image.',
]

const FAQS = [
  { q: 'What do the sliders control?', a: 'Brightness controls the overall lightness. Contrast controls the difference between light and dark areas. Saturation controls the intensity of colors (0% = grayscale, 200% = very vivid).' },
  { q: 'What is the default value?', a: 'All sliders default to 100%, which means no change. Adjust up or down from 100% to see the effect.' },
  { q: 'Will the output quality be affected?', a: 'Minor adjustments preserve near-original quality. Extreme adjustments may show compression artifacts in JPG output.' },
  { q: 'What image formats are supported?', a: 'JPG, PNG, and WebP images are supported. The output is saved as JPG.' },
]

export default function ImageBrightnessPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ImageBrightnessClient />
    </ToolLayout>
  )
}
