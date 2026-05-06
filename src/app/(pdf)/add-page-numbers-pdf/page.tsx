import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { AddPageNumbersPdfClient } from './AddPageNumbersPdfClient'

const tool = getToolBySlug('add-page-numbers-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Add Page Numbers to PDF Online Free | PDF and Image +',
    description: 'Add automatic page numbers to any PDF file online. Choose from bottom center, bottom right, or top center position. Free and instant.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Add Page Numbers to PDF Online Free | PDF and Image +',
      description: 'Add automatic page numbers to any PDF file online. Choose from bottom center, bottom right, or top center position. Free and instant.',
    },
    twitter: {
      title: 'Add Page Numbers to PDF Online Free | PDF and Image +',
      description: 'Add automatic page numbers to any PDF file online. Choose from bottom center, bottom right, or top center position. Free and instant.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF by dragging it into the drop zone or clicking to select a file from your device.',
  'Choose where the page numbers should appear: Bottom Center, Bottom Right, or Top Center.',
  'Click "Add Page Numbers" and your updated PDF will download automatically.',
]

const FAQS = [
  { q: 'What format are the page numbers?', a: 'Page numbers are added as plain numbers (1, 2, 3…) in a standard font. They are placed in the margin area of each page.' },
  { q: 'Can I start numbering from a different number?', a: 'Currently, numbering always starts from 1. If you need to start from a different number, this feature may be added in a future update.' },
  { q: 'Will page numbers overlap with existing content?', a: 'Page numbers are placed in the margin area near the edge of the page, which is typically empty. However, on PDFs with no margins, there may be some overlap.' },
  { q: 'Does this work on all PDF types?', a: 'Yes, it works on standard PDFs including scanned documents, forms, and regular text PDFs. Encrypted or password-protected PDFs must be unlocked first.' },
  { q: 'Are my files processed securely?', a: 'Yes. All processing happens locally in your browser. Your PDF is never sent to any server, ensuring complete privacy.' },
]

export default function AddPageNumbersPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <AddPageNumbersPdfClient />
    </ToolLayout>
  )
}
