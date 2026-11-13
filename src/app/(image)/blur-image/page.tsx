import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { BlurImageClient } from './BlurImageClient'

const tool = getToolBySlug('blur-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Blur Image & Background Online Free",
    description: "Blur a photo or just its background online for free. Keeps people sharp and softens the rest, right in your browser. No sign-up, no upload.",
    keywords: [...tool.keywords, 'blur background of photo', 'blur background online free', 'background blur portrait'],
    openGraph: {
      title: 'Blur Image & Background Online Free | PDF and Image +',
      description: 'Blur a whole image or just the background behind people, free, in your browser. Files never leave your device.',
    },
    twitter: {
      title: 'Blur Image & Background Online Free | PDF and Image +',
      description: 'Blur a whole image or just the background behind people, free, in your browser. Files never leave your device.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/blur-image')
}

const HOW_TO_STEPS = [
  'Upload your JPG, PNG, or WebP image using the file picker or drag and drop.',
  'Choose "Whole image" or "Background only" (for photos of people), then set the Blur Intensity slider.',
  'Click the blur button, compare the before and after previews, and download the result.',
]

const FAQS = [
  {
    q: 'How do I blur the background of a photo?',
    a: 'Pick "Background only" and click Blur Background. The tool finds the people in your photo, keeps them sharp, and blurs everything behind them. It works best on portraits, selfies, and other clear photos of people.',
  },
  {
    q: 'Does background blur work on objects, pets, or products?',
    a: 'No. Background mode detects people only. For a photo of an object or animal it will tell you no person was found. Use "Whole image" for an overall blur instead.',
  },
  {
    q: 'Is my photo uploaded to a server?',
    a: 'No. Both modes run in your browser. The small person-detection model is served from this site and runs locally, so your image never leaves your device.',
  },
  {
    q: 'What blur strength should I use?',
    a: 'A radius of 5-15 gives a soft look. 20-35 gives a strong portrait-style background blur. 40-50 is extreme, useful for privacy or artistic effects.',
  },
  {
    q: 'Will the image size or quality change?',
    a: 'No. The output keeps the original dimensions and format (PNG stays PNG, JPG stays JPG). Only the blurred areas change.',
  },
]

export default function BlurImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <BlurImageClient />
    </ToolLayout>
  )
}
