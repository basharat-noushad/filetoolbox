import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToWordClient } from './PdfToWordClient'

const tool = getToolBySlug('pdf-to-word')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "PDF to Word Online Free — Convert to DOCX",
    description: "PDF to Word online for free: convert to editable .docx. Runs in your browser, with OCR for scanned pages. Files up to 100 MB, no sign-up.",
    keywords: tool.keywords,
    openGraph: {
      title: "PDF to Word Online Free — Convert to DOCX | PDF and Image +",
      description: "PDF to Word online for free: convert to editable .docx. Runs in your browser, with OCR for scanned pages. Files up to 100 MB, no sign-up.",
    },
    twitter: {
      title: "PDF to Word Online Free — Convert to DOCX | PDF and Image +",
      description: "PDF to Word online for free: convert to editable .docx. Runs in your browser, with OCR for scanned pages. Files up to 100 MB, no sign-up.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/pdf-to-word')
}

const HOW_TO_STEPS = [
  'Click "Select File" or drag and drop your PDF file into the upload area.',
  'Click "Convert to Word" to start the conversion process.',
  'Download your editable Word (.docx) file instantly.',
]

const FAQS = [
  { q: 'How accurate is the PDF to Word conversion?', a: 'For text-based PDFs, conversion is highly accurate. Scanned pages are read with OCR in your browser and become editable text; bold, italics and tables in a scan are not recognised. If a scanned page cannot be read, files up to 4 MB go to the online converter, and larger files keep that page as a picture.' },
  { q: 'What Word format does the output use?', a: 'The converted file is in .docx format, compatible with Microsoft Word, Google Docs, LibreOffice, and all modern word processors.' },
  { q: 'What are the conversion limits?', a: 'One PDF up to 100 MB at a time. Conversion runs in your browser, so there is no daily or monthly limit. The online converter, used as a backup, accepts files up to 4 MB.' },
  { q: 'Will my formatting be preserved?', a: 'Review tables, columns, fonts and page breaks after conversion. Complex layouts can need manual reconstruction.' },
  { q: 'Is my PDF uploaded for conversion?', a: 'Usually not. The conversion runs in your browser, including reading scanned pages, and the file stays on your device. It is sent to our online converter (Adobe PDF Services) only if your browser cannot convert it, a scanned page cannot be read, or you choose to retry online.' },
]

export default function PdfToWordPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToWordClient />
    </ToolLayout>
  )
}
