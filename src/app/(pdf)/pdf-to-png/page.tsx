import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToPngClient } from './PdfToPngClient'

const tool = getToolBySlug('pdf-to-png')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PDF to PNG Online Free — Convert PDF Pages to PNG Images | FileToolBox',
    description: 'Convert PDF pages to high-quality PNG images online for free. Transparent background support. Download as ZIP. No registration.',
    keywords: tool.keywords,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file by clicking "Select File" or dragging and dropping.',
  'The tool converts all pages to PNG at 2× resolution for crisp quality.',
  'Click "Convert to PNG" and download your images as a ZIP file.',
]

const FAQS = [
  { q: 'Why PNG instead of JPG?', a: 'PNG supports transparency and is lossless, making it ideal for presentations, designs, and web graphics.' },
  { q: 'What resolution are the PNG images?', a: 'Images are rendered at 2× scale (effectively ~144 DPI) for high-quality output suitable for most use cases.' },
  { q: 'Can I use the PNGs in presentations?', a: 'Yes. PNG format is perfect for PowerPoint, Google Slides, Keynote, and other presentation tools.' },
  { q: 'Is there a page limit?', a: 'No page limit. All pages are converted in your browser — no files are uploaded.' },
]

export default function PdfToPngPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToPngClient />
    </ToolLayout>
  )
}
