import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { JpgToPdfClient } from './JpgToPdfClient'

const tool = getToolBySlug('jpg-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "JPG to PDF Online Free — Convert Images to PDF",
    description: "Convert JPG to PDF online for free. Add up to 20 JPG or PNG images and download them as one PDF, with no quality loss and no sign-up.",
    keywords: tool.keywords,
    openGraph: {
      title: "JPG to PDF Online Free — Convert Images to PDF | PDF and Image +",
      description: "Convert JPG to PDF online for free. Add up to 20 JPG or PNG images and download them as one PDF, with no quality loss and no sign-up.",
    },
    twitter: {
      title: "JPG to PDF Online Free — Convert Images to PDF | PDF and Image +",
      description: "Convert JPG to PDF online for free. Add up to 20 JPG or PNG images and download them as one PDF, with no quality loss and no sign-up.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/jpg-to-pdf')
}

const HOW_TO_STEPS = [
  'Click "Select Files" or drag and drop your JPG images (multiple files supported).',
  'Drag images (or use the up/down arrows) into the order you want — pages follow the list.',
  'Click "Convert to PDF" and download your combined PDF file.',
]

const FAQS = [
  { q: 'How many images can I convert at once?', a: 'You can convert up to 20 images at once into a single PDF document.' },
  { q: 'Does it support PNG images too?', a: 'Yes. Both JPG/JPEG and PNG images are supported for conversion to PDF.' },
  { q: 'Will the image quality be preserved?', a: 'Yes. Images are embedded at their original resolution with no quality loss.' },
  { q: 'Can I reorder the images before converting?', a: 'Yes. Drag the handle next to each image, or use its Move up / Move down buttons. The PDF pages follow the list order.' },
  { q: 'Can I mix JPG and PNG images in the same PDF?', a: 'Yes. Both JPG and PNG files can be combined into a single PDF. Each image becomes one page.' },
  { q: 'What page size will the output PDF use?', a: 'Each page is sized to match the dimensions of the corresponding image. There is no fixed page size — the PDF adapts to each image.' },
]

export default function JpgToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <JpgToPdfClient />
    </ToolLayout>
  )
}
