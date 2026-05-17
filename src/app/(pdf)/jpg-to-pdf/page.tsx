import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { JpgToPdfClient } from './JpgToPdfClient'

const tool = getToolBySlug('jpg-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'JPG to PDF Online Free — Convert Images to PDF',
    description: 'Convert JPG images to a PDF file online for free. Add multiple images and download as a single PDF. No registration needed.',
    keywords: tool.keywords,
    openGraph: {
      title: 'JPG to PDF Online Free — Convert Images to PDF | PDF and Image +',
      description: 'Convert JPG images to a PDF file online for free. Add multiple images and download as a single PDF. No registration needed.',
    },
    twitter: {
      title: 'JPG to PDF Online Free — Convert Images to PDF | PDF and Image +',
      description: 'Convert JPG images to a PDF file online for free. Add multiple images and download as a single PDF. No registration needed.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Click "Select Files" or drag and drop your JPG images (multiple files supported).',
  'Review the selected images — they will appear in the PDF in the listed order.',
  'Click "Convert to PDF" and download your combined PDF file.',
]

const FAQS = [
  { q: 'How many images can I convert at once?', a: 'You can convert up to 20 images at once into a single PDF document.' },
  { q: 'Does it support PNG images too?', a: 'Yes. Both JPG/JPEG and PNG images are supported for conversion to PDF.' },
  { q: 'Will the image quality be preserved?', a: 'Yes. Images are embedded at their original resolution with no quality loss.' },
  { q: 'Can I reorder the images before converting?', a: 'The images appear in the PDF in the order they are listed. Select files in the desired order.' },
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
