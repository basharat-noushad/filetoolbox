import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { RemoveBackgroundClient } from './RemoveBackgroundClient'

const tool = getToolBySlug('remove-background')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: 'Remove Background Online Free — AI Background Remover',
    description: 'Remove image backgrounds automatically in seconds using AI. Free to use, no registration required. Download a transparent PNG ready for any design.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Remove Background Online Free — AI Background Remover | PDF and Image +',
      description: 'Remove image backgrounds automatically in seconds using AI. Free, transparent PNG output, no registration.',
    },
    twitter: {
      title: 'Remove Background Online Free — AI Background Remover | PDF and Image +',
      description: 'Remove image backgrounds automatically in seconds using AI. Free, transparent PNG output, no registration.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/remove-background')
}

const HOW_TO_STEPS = [
  'Upload your photo by clicking "Select File" or dragging and dropping it into the upload area.',
  'The AI automatically detects the subject and removes the background in seconds.',
  'Download your image as a transparent PNG file — ready to use on any background.',
]

const FAQS = [
  {
    q: 'What types of images work best for background removal?',
    a: 'Photos with a clear subject and contrasting background work best — portraits, product shots, animals, vehicles, and logos. High-contrast photos with a defined subject produce the most accurate results.',
  },
  {
    q: 'What format is the output file?',
    a: 'The output is always a PNG file with a transparent background. PNG is the only format that supports transparency, making it ideal for placing your subject on any background color or image.',
  },
  {
    q: 'Is background removal really free?',
    a: 'Yes. There are no watermarks and no registration. To keep the service available for everyone, there is a fair-use limit on how many images you can process per hour.',
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
    a: 'Yes. Download the transparent PNG, then open it in any design tool — Canva, Google Slides, PowerPoint, Figma, or Photoshop. Place it on any background color, image, or texture you choose.',
  },
]

export default function RemoveBackgroundPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <RemoveBackgroundClient />
    </ToolLayout>
  )
}
