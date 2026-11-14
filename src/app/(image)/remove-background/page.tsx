import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { RemoveBackgroundClient } from './RemoveBackgroundClient'

const tool = getToolBySlug('remove-background')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Remove Background & Change Color Online Free",
    description: "Remove background from image online free with AI, then keep it transparent or switch to a white, blue or custom color. Photos are sent to an AI service.",
    keywords: tool.keywords,
    openGraph: {
      title: "Remove Background & Change Color Online Free | PDF and Image +",
      description: 'Remove image backgrounds automatically in seconds using AI. Free, transparent PNG output, no registration.',
    },
    twitter: {
      title: "Remove Background & Change Color Online Free | PDF and Image +",
      description: 'Remove image backgrounds automatically in seconds using AI. Free, transparent PNG output, no registration.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/remove-background')
}

const HOW_TO_STEPS = [
  'Upload your photo by clicking "Select File" or dragging and dropping it into the upload area.',
  'The AI automatically detects the subject and removes the background in seconds.',
  'Keep it transparent or pick a white, grey, blue, red or custom background, then download the PNG or JPG.',
]

const FAQS = [
  {
    q: 'What types of images work best for background removal?',
    a: 'Photos with a clear subject and contrasting background work best — portraits, product shots, animals, vehicles, and logos. High-contrast photos with a defined subject produce the most accurate results.',
  },
  {
    q: 'What format is the output file?',
    a: 'With a transparent background the output is a PNG. If you pick a solid background colour you can download it as PNG or as a smaller JPG.',
  },
  {
    q: 'Is background removal really free?',
    a: 'Yes. There are no watermarks and no registration. Because each removal uses a paid AI service, there is a fair-use limit on how many images you can process per hour, and uploads are limited to 4 MB.',
  },
  {
    q: 'How accurate is the AI at removing backgrounds?',
    a: 'Accuracy is very high for photos with clear, high-contrast subjects. Hair, fur, and transparent objects (glasses, bottles) are more challenging and may have slightly imprecise edges. For professional use, the AI result makes an excellent starting point for manual refinement.',
  },
  {
    q: 'Is my photo uploaded to a server?',
    a: 'Yes. Your photo is sent over HTTPS to a third-party AI background-removal service, which returns the transparent PNG. Only upload images you are comfortable sending to an online service.',
  },
  {
    q: 'Can I change the background to a different color after removing it?',
    a: 'Yes. After the background is removed, choose White, Light grey, Blue, Red or any custom colour. This is applied in your browser and does not use the AI service again. For a background image or texture, download the transparent PNG and place it in a design tool.',
  },
]

export default function RemoveBackgroundPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <RemoveBackgroundClient />
    </ToolLayout>
  )
}
