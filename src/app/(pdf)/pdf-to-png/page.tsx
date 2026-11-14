import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToPngClient } from './PdfToPngClient'

const tool = getToolBySlug('pdf-to-png')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "PDF to PNG Online Free — Convert PDF Pages",
    description: "Convert PDF to PNG online free at 72, 150 or 300 DPI. High-resolution PNG pages in one ZIP. Runs in your browser, nothing is uploaded.",
    keywords: tool.keywords,
    openGraph: {
      title: "PDF to PNG Online Free — Convert PDF Pages | PDF and Image +",
      description: "Convert PDF to PNG online free at 72, 150 or 300 DPI. High-resolution PNG pages in one ZIP. Runs in your browser, nothing is uploaded.",
    },
    twitter: {
      title: "PDF to PNG Online Free — Convert PDF Pages | PDF and Image +",
      description: "Convert PDF to PNG online free at 72, 150 or 300 DPI. High-resolution PNG pages in one ZIP. Runs in your browser, nothing is uploaded.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/pdf-to-png')
}

const HOW_TO_STEPS = [
  'Upload your PDF file by clicking "Select File" or dragging and dropping.',
  'Choose a resolution: 72 DPI for screens, 150 DPI standard, or 300 DPI for print.',
  'Click "Convert to PNG" and download your images as a ZIP file.',
]

const FAQS = [
  { q: 'Why PNG instead of JPG?', a: 'PNG supports transparency and is lossless, making it ideal for presentations, designs, and web graphics.' },
  { q: 'What resolution are the PNG images?', a: 'You choose 72, 150 (default) or 300 DPI. Pixel size is the page size in inches times the DPI, so an A4 page is about 1240 x 1754 px at 150 DPI.' },
  { q: 'How do I convert PDF to PNG at 300 DPI?', a: 'Select 300 DPI before converting. This gives high-resolution, print-quality PNGs but the files are large, especially for PDFs with many pages.' },
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
