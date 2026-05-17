import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { RemoveBackgroundClient } from './RemoveBackgroundClient'

const tool = getToolBySlug('remove-background')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Remove Background Online Free — AI Background Remover',
    description: 'Remove image backgrounds automatically in seconds using AI. Free to use. Download transparent PNG. No registration required, no file uploads.',
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
  }
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
    a: 'Yes, completely free. There are no usage limits, no watermarks, and no registration required. Process as many images as you need at no cost.',
  },
  {
    q: 'How accurate is the AI at removing backgrounds?',
    a: 'Accuracy is very high for photos with clear, high-contrast subjects. Hair, fur, and transparent objects (glasses, bottles) are more challenging and may have slightly imprecise edges. For professional use, the AI result makes an excellent starting point for manual refinement.',
  },
  {
    q: 'Is my photo uploaded to a server?',
    a: 'No. Background removal runs entirely in your browser. Your photo never leaves your device — no uploads, no server processing, complete privacy.',
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
