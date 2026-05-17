import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { BlurImageClient } from './BlurImageClient'

const tool = getToolBySlug('blur-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Blur Image Online Free — Add Gaussian Blur to Photos',
    description: 'Apply Gaussian blur to images online for free. Control blur intensity with a simple slider. Blur backgrounds, hide details, or create effects.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Blur Image Online Free — Gaussian Blur Photo Tool | PDF and Image +',
      description: 'Apply Gaussian blur to images online for free. Control intensity with a slider.',
    },
    twitter: {
      title: 'Blur Image Online Free — Gaussian Blur Photo Tool | PDF and Image +',
      description: 'Apply Gaussian blur to images online for free. Control intensity with a slider.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your JPG, PNG, or WebP image using the file picker or drag and drop.',
  'Drag the "Blur Intensity" slider to set how strong the blur effect should be (1 = subtle, 50 = heavy).',
  'Click "Apply Blur" to process the image and download the blurred result.',
]

const FAQS = [
  {
    q: 'What type of blur does this tool apply?',
    a: 'This tool applies Gaussian blur via the browser\'s canvas filter API. It creates a smooth, natural-looking softening effect across the entire image.',
  },
  {
    q: 'Can I blur only part of an image?',
    a: 'Currently, the blur is applied to the entire image. For partial blur (e.g. blurring a face or background), you would need a more advanced editing tool.',
  },
  {
    q: 'What blur radius should I use?',
    a: 'A radius of 5–15 creates a subtle soft effect. 20–35 creates a heavy background blur. 40–50 creates an extreme blur effect for privacy or artistic purposes.',
  },
  {
    q: 'Will the image dimensions change after blurring?',
    a: 'No. The image dimensions stay exactly the same. Only the pixel values are modified by the blur algorithm.',
  },
  {
    q: 'Is my image uploaded to a server?',
    a: 'No. All processing is done locally in your browser using the HTML5 Canvas API. Your image is never sent anywhere.',
  },
]

export default function BlurImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <BlurImageClient />
    </ToolLayout>
  )
}
