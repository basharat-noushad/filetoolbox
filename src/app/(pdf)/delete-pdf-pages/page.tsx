import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { DeletePdfPagesClient } from './DeletePdfPagesClient'

const tool = getToolBySlug('delete-pdf-pages')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Delete PDF Pages Online Free — Remove Pages from PDF | FileToolBox',
    description: 'Remove specific pages from a PDF document online for free. Enter page numbers to delete and download the clean PDF instantly.',
    keywords: tool.keywords,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file by clicking "Select File" or dragging and dropping.',
  'Enter the page numbers you want to delete (e.g. "2, 4, 6-8").',
  'Click "Delete Pages" and download your updated PDF.',
]

const FAQS = [
  { q: 'How do I specify which pages to delete?', a: 'Enter page numbers separated by commas (e.g. "2, 4") or ranges (e.g. "6-8"). These pages will be removed.' },
  { q: 'Is there a minimum number of pages that must remain?', a: 'You must keep at least one page. You cannot delete all pages from a PDF.' },
  { q: 'Will the page numbering update after deletion?', a: 'The remaining pages are renumbered sequentially in the output PDF.' },
  { q: 'Can I undo a deletion?', a: 'No — but your original file is never modified. The download is a new file, so your original stays intact.' },
]

export default function DeletePdfPagesPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <DeletePdfPagesClient />
    </ToolLayout>
  )
}
