import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { SplitPdfClient } from './SplitPdfClient'

const tool = getToolBySlug('split-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Split PDF Online Free — Extract PDF Pages",
    description: "Split PDF by page range or extract single pages online for free. Download every part as a PDF inside one ZIP. No page limit, no registration.",
    keywords: tool.keywords,
    openGraph: {
      title: "Split PDF Online Free — Extract PDF Pages | PDF and Image +",
      description: "Split PDF by page range or extract single pages online for free. Download every part as a PDF inside one ZIP. No page limit, no registration.",
    },
    twitter: {
      title: "Split PDF Online Free — Extract PDF Pages | PDF and Image +",
      description: "Split PDF by page range or extract single pages online for free. Download every part as a PDF inside one ZIP. No page limit, no registration.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/split-pdf')
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
