import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { RemoveBackgroundClient } from './RemoveBackgroundClient'

const tool = getToolBySlug('remove-background')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Remove Background Online Free — AI Background Remover | FileToolBox',
    description: 'Remove image background automatically in seconds. Powered by AI. Free to use. Download transparent PNG. No registration.',
    keywords: tool.keywords,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your photo by clicking "Select File" or dragging and dropping.',
  'Our AI automatically detects and removes the background.',
  'Download your image with transparent background as a PNG file.',
]

const FAQS = [
  { q: 'What types of images work best?', a: 'Photos with clear subjects like people, products, animals, and logos work best. The AI handles most common backgrounds.' },
  { q: 'What format is the output?', a: 'The output is always a PNG file with transparent background, ideal for use on any background color.' },
  { q: 'Is it really free?', a: 'Yes. A limited number of free uses are available. The quality may differ from paid services.' },
  { q: 'How accurate is the AI?', a: 'Accuracy is very high for photos with clear subjects. Complex backgrounds or fine details like hair may need minor touch-ups.' },
]

export default function RemoveBackgroundPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <RemoveBackgroundClient />
    </ToolLayout>
  )
}
