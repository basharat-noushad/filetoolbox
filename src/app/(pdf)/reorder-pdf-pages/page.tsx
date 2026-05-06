import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ReorderPdfPagesClient } from './ReorderPdfPagesClient'

const tool = getToolBySlug('reorder-pdf-pages')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Reorder PDF Pages Online Free — Rearrange PDF | PDF and Image +',
    description: 'Rearrange pages in a PDF online for free. Simply enter the new page order and download your reorganized PDF. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Reorder PDF Pages Online Free — Rearrange PDF | PDF and Image +',
      description: 'Rearrange pages in a PDF online for free. Simply enter the new page order and download your reorganized PDF. No registration required.',
    },
    twitter: {
      title: 'Reorder PDF Pages Online Free — Rearrange PDF | PDF and Image +',
      description: 'Rearrange pages in a PDF online for free. Simply enter the new page order and download your reorganized PDF. No registration required.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file by dragging and dropping it or clicking to browse.',
  'Once uploaded, the page count will be shown. Enter your desired page order as comma-separated numbers (e.g. "3,1,2,4").',
  'Click "Reorder Pages" and download your rearranged PDF instantly.',
]

const FAQS = [
  { q: 'How do I specify the new page order?', a: 'Enter the page numbers separated by commas in the order you want them to appear. For example, "3,1,2,4" means page 3 becomes the first page, page 1 becomes second, and so on.' },
  { q: 'Do I need to include all pages?', a: 'Yes, you must include all page numbers in your order input. If your PDF has 4 pages, you need to enter all 4 page numbers (e.g. "2,4,1,3").' },
  { q: 'Are my files kept private?', a: 'Absolutely. All processing happens locally in your browser. Your PDF is never uploaded to any server, so your files remain completely private.' },
  { q: 'Is there a page limit?', a: 'There is no hard page limit. The tool works entirely in your browser, so very large PDFs may take a moment to process depending on your device.' },
  { q: 'Will the content or formatting change?', a: 'No. Only the order of pages changes. All content, formatting, fonts, and images remain exactly as in the original file.' },
]

export default function ReorderPdfPagesPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ReorderPdfPagesClient />
    </ToolLayout>
  )
}
