import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Base64ToImageClient } from './Base64ToImageClient'

const tool = getToolBySlug('base64-to-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Base64 to Image Decoder Online Free — Base64 Converter',
    description: 'Decode Base64 encoded strings back to image files online for free. Preview and download the decoded image instantly. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Base64 to Image Converter Free Online | PDF and Image +',
      description: 'Decode Base64 strings back to image files online for free. Preview and download instantly.',
    },
    twitter: {
      title: 'Base64 to Image Converter Free Online | PDF and Image +',
      description: 'Decode Base64 strings back to image files online for free. Preview and download instantly.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Paste your Base64 encoded string into the text area. You can include or omit the "data:image/...;base64," prefix.',
  'Click "Decode Image" to convert the Base64 string back into an image file.',
  'Preview the image and click "Download" to save it to your device.',
]

const FAQS = [
  {
    q: 'What format should the Base64 string be in?',
    a: 'You can paste the full data URL (e.g. data:image/png;base64,ABC...) or just the raw Base64 characters. The tool handles both formats automatically.',
  },
  {
    q: 'What image formats can be decoded?',
    a: 'Any image format encoded as Base64 can be decoded — PNG, JPG, WebP, GIF, and others. The output format depends on what was originally encoded.',
  },
  {
    q: 'Is my Base64 data sent to a server?',
    a: 'No. The decoding happens entirely in your browser using the native fetch API. Your data stays on your device.',
  },
  {
    q: 'Why is my decoded image showing incorrectly?',
    a: 'Ensure your Base64 string is valid and complete. If the string is truncated or corrupted, the image may not render correctly.',
  },
]

export default function Base64ToImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <Base64ToImageClient />
    </ToolLayout>
  )
}
