import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { WordToPdfClient } from './WordToPdfClient'

const tool = getToolBySlug('word-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Word to PDF Online Free — Convert DOCX to PDF | PDF and Image +',
    description: 'Convert Word documents to PDF online for free. Preserves formatting perfectly. No registration needed. Fast and reliable.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Word to PDF Online Free — Convert DOCX to PDF | PDF and Image +',
      description: 'Convert Word documents to PDF online for free. Preserves formatting perfectly. No registration needed. Fast and reliable.',
    },
    twitter: {
      title: 'Word to PDF Online Free — Convert DOCX to PDF | PDF and Image +',
      description: 'Convert Word documents to PDF online for free. Preserves formatting perfectly. No registration needed. Fast and reliable.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Click "Select File" or drag and drop your Word document (.docx or .doc).',
  'Click "Convert to PDF" to start the conversion.',
  'Download your PDF file with perfect formatting preserved.',
]

const FAQS = [
  { q: 'Does it support both .doc and .docx files?', a: 'Yes, both .doc (older Word format) and .docx (modern format) files are supported.' },
  { q: 'Will my formatting be preserved?', a: 'Yes. Fonts, tables, images, headers, footers, and all formatting are preserved in the PDF output.' },
  { q: 'Is there a file size limit?', a: 'Files up to 50MB are supported. For larger files, consider splitting the document first.' },
  { q: 'Can I convert password-protected Word files?', a: 'Password-protected files cannot be converted. Please remove the password protection first.' },
]

export default function WordToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <WordToPdfClient />
    </ToolLayout>
  )
}
