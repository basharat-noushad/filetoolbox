import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToJpgClient } from './PdfToJpgClient'

const tool = getToolBySlug('pdf-to-jpg')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PDF to JPG Online Free — Convert PDF Pages to Images | PDF and Image +',
    description: 'Convert PDF pages to high-quality JPG images online for free. Download individually or as a ZIP. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'PDF to JPG Online Free — Convert PDF Pages to Images | PDF and Image +',
      description: 'Convert PDF pages to high-quality JPG images online for free. Download individually or as a ZIP. No registration required.',
    },
    twitter: {
      title: 'PDF to JPG Online Free — Convert PDF Pages to Images | PDF and Image +',
      description: 'Convert PDF pages to high-quality JPG images online for free. Download individually or as a ZIP. No registration required.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file by clicking "Select File" or dragging and dropping.',
  'Choose the image quality — Standard (72 DPI), High (150 DPI), or Ultra (300 DPI).',
  'Click "Convert to JPG" and download your images as a ZIP file.',
]

const FAQS = [
  { q: 'What DPI options are available?', a: 'Standard (72 DPI) for web use, High (150 DPI) for general use, and Ultra (300 DPI) for print quality.' },
  { q: 'Will each PDF page become a separate JPG?', a: 'Yes. Each page of your PDF becomes an individual JPG image, numbered sequentially.' },
  { q: 'How are the images delivered?', a: 'All images are bundled in a single ZIP file for convenient download.' },
  { q: 'Can I convert just specific pages?', a: 'Currently all pages are converted. Use the Split PDF tool first to extract specific pages, then convert.' },
]

export default function PdfToJpgPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToJpgClient />
    </ToolLayout>
  )
}
