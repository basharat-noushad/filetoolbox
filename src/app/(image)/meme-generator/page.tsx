import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { MemeGeneratorClient } from './MemeGeneratorClient'

const tool = getToolBySlug('meme-generator')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Meme Generator Online Free — Create Memes Instantly | PDF and Image +',
    description: 'Create custom memes online for free. Upload any image, add top and bottom text with Impact font. Download your meme instantly. No sign-up.',
    keywords: tool.keywords,
    openGraph: { title: 'Meme Generator Online Free | PDF and Image +', description: 'Create custom memes online for free. Upload any image, add text, download instantly.' },
    twitter: { title: 'Meme Generator Online Free | PDF and Image +', description: 'Create custom memes online for free. Upload any image, add text, download instantly.' },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload an image or photo to use as your meme base.',
  'Type your top text and bottom text in the input fields and adjust the font size.',
  'Click "Generate Meme" and download your creation instantly.',
]

const FAQS = [
  { q: 'What image formats are supported?', a: 'You can upload JPG and PNG images. Most meme templates work great in both formats.' },
  { q: 'What font is used for the meme text?', a: 'We use the classic Impact font (or Arial as fallback), which is the standard font used in traditional internet memes.' },
  { q: 'Can I use any image?', a: 'Yes! Upload any JPG or PNG image from your device. You can use photos, screenshots, or downloaded meme templates.' },
  { q: 'Is the meme generator free?', a: 'Yes, completely free. No registration, no watermarks, no file size limits. Download your meme instantly.' },
]

export default function MemeGeneratorPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <MemeGeneratorClient />
    </ToolLayout>
  )
}
