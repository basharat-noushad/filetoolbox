import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { WordToPdfClient } from './WordToPdfClient'

const tool = getToolBySlug('word-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Word to PDF Online Free — Convert DOCX to PDF",
    description: "Word to PDF online for free: convert .docx and .doc files. Text, tables and images are kept, and conversion runs in your browser. Up to 100 MB.",
    keywords: tool.keywords,
    openGraph: {
      title: "Word to PDF Online Free — Convert DOCX to PDF | PDF and Image +",
      description: "Word to PDF online for free: convert .docx and .doc files. Text, tables and images are kept, and conversion runs in your browser. Up to 100 MB.",
    },
    twitter: {
      title: "Word to PDF Online Free — Convert DOCX to PDF | PDF and Image +",
      description: "Word to PDF online for free: convert .docx and .doc files. Text, tables and images are kept, and conversion runs in your browser. Up to 100 MB.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/word-to-pdf')
}

const HOW_TO_STEPS = [
  'Click "Select File" or drag and drop your Word document (.docx or .doc).',
  'Click "Convert to PDF" to start the conversion.',
  'Download your PDF file with perfect formatting preserved.',
]

const FAQS = [
  { q: 'Does it support both .doc and .docx files?', a: 'Yes, both .doc (older Word format) and .docx (modern format) files are supported.' },
  { q: 'Will my formatting be preserved?', a: 'Text, tables, images, headers and footers are preserved. Calibri, Cambria, Arial and Times New Roman are replaced with matching open fonts, so line breaks can differ slightly; check the PDF before sending it on.' },
  { q: 'Is there a file size limit?', a: 'Files up to 100MB are supported. The conversion runs in your browser, so the file stays on your device. Only a file your browser cannot convert is sent to our online converter, which accepts up to 4MB.' },
  { q: 'Can I convert password-protected Word files?', a: 'Password-protected files cannot be converted. Please remove the password protection first.' },
]

export default function WordToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <WordToPdfClient />
    </ToolLayout>
  )
}
