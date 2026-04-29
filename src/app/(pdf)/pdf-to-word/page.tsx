import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToWordClient } from './PdfToWordClient'

const tool = getToolBySlug('pdf-to-word')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PDF to Word Online Free — Convert PDF to DOCX | FileToolBox',
    description: 'Convert PDF files to editable Word documents (.docx) online for free. No registration, no watermarks. Fast and accurate conversion.',
    keywords: tool.keywords,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Click "Select File" or drag and drop your PDF file into the upload area.',
  'Click "Convert to Word" to start the conversion process.',
  'Download your editable Word (.docx) file instantly.',
]

const FAQS = [
  { q: 'How accurate is the PDF to Word conversion?', a: 'For text-based PDFs, conversion is highly accurate. Scanned PDFs require OCR and may have lower accuracy.' },
  { q: 'What Word format does the output use?', a: 'The converted file is in .docx format, compatible with Microsoft Word, Google Docs, LibreOffice, and all modern word processors.' },
  { q: 'Is there a page limit for conversion?', a: 'No page limit. However, very large PDFs may take longer to process.' },
  { q: 'Will my formatting be preserved?', a: 'Basic formatting like paragraphs, headings, and tables is preserved. Complex layouts may need minor adjustments.' },
]

export default function PdfToWordPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToWordClient />
    </ToolLayout>
  )
}
