import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ExtractPdfPagesClient } from './ExtractPdfPagesClient'

const tool = getToolBySlug('extract-pdf-pages')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Extract PDF Pages Online Free — Save Pages as New PDF',
    description: 'Extract specific pages from a PDF and save as a new PDF file. Enter page numbers or ranges like 1,3,5-7. Free, no registration required.',
    keywords: tool.keywords,
    openGraph: { title: 'Extract PDF Pages Online Free | PDF and Image +', description: 'Extract specific pages from any PDF online for free. Enter page numbers or ranges.' },
    twitter: { title: 'Extract PDF Pages Online Free | PDF and Image +', description: 'Extract specific pages from any PDF online for free. Enter page numbers or ranges.' },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload the PDF file you want to extract pages from.',
  'Enter the page numbers or ranges you want to keep (e.g. 1,3,5-7).',
  'Click "Extract Pages" and download your new PDF with only the selected pages.',
]

const FAQS = [
  { q: 'How do I specify page ranges?', a: 'Use commas to separate individual pages and hyphens for ranges. For example: "1,3,5-7" extracts pages 1, 3, 5, 6, and 7.' },
  { q: 'What is the difference between Extract and Split?', a: 'Extract lets you pick specific pages and saves them all into one new PDF. Split divides a PDF into multiple separate files by range.' },
  { q: 'Does the extracted PDF keep the original formatting?', a: 'Yes. Extracted pages retain all original content, fonts, images, and formatting exactly as in the source PDF.' },
  { q: 'Is there a page limit?', a: 'No. You can extract any number of pages from any size PDF. All processing happens in your browser.' },
]

export default function ExtractPdfPagesPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ExtractPdfPagesClient />
    </ToolLayout>
  )
}
