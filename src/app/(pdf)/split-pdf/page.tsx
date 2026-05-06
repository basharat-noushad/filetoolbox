import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { SplitPdfClient } from './SplitPdfClient'

const tool = getToolBySlug('split-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Split PDF Online Free — Extract PDF Pages | PDF and Image +',
    description: 'Split PDF files by page range or extract individual pages online for free. Download as ZIP. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Split PDF Online Free — Extract PDF Pages | PDF and Image +',
      description: 'Split PDF files by page range or extract individual pages online for free. Download as ZIP. No registration required.',
    },
    twitter: {
      title: 'Split PDF Online Free — Extract PDF Pages | PDF and Image +',
      description: 'Split PDF files by page range or extract individual pages online for free. Download as ZIP. No registration required.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file by clicking "Select File" or dragging and dropping.',
  'Enter the page ranges you want to split (e.g. "1-3, 5, 7-9").',
  'Click "Split PDF" and download your ZIP file with separate PDF parts.',
]

const FAQS = [
  { q: 'How do I specify page ranges?', a: 'Enter ranges like "1-3, 5, 7-9". Each range creates a separate PDF. Single pages use a single number (e.g. "5").' },
  { q: 'What format is the output?', a: 'Each split part is a separate PDF file. All parts are bundled in a ZIP file for easy download.' },
  { q: 'Can I extract a single page?', a: 'Yes. Enter a single page number (e.g. "5") to extract just that page as its own PDF.' },
  { q: 'Is there a page limit?', a: 'No page limit. Split PDFs of any size entirely in your browser with no server upload needed.' },
]

export default function SplitPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <SplitPdfClient />
    </ToolLayout>
  )
}
