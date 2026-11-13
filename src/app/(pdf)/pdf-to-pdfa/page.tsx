import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToPdfaClient } from './PdfToPdfaClient'

const tool = getToolBySlug('pdf-to-pdfa')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "PDF to PDF/A Online Free — Archive Format",
    description: "Convert PDF to PDF/A-2b online for free for long-term archiving. Fonts are embedded and an sRGB profile added. Files never leave your device.",
    keywords: tool.keywords,
    openGraph: {
      title: 'PDF to PDF/A Converter Free Online | PDF and Image +',
      description: "Convert PDF to PDF/A-2b online for free for long-term archiving. Fonts are embedded and an sRGB profile added. Files never leave your device.",
    },
    twitter: {
      title: 'PDF to PDF/A Converter Free Online | PDF and Image +',
      description: "Convert PDF to PDF/A-2b online for free for long-term archiving. Fonts are embedded and an sRGB profile added. Files never leave your device.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/pdf-to-pdfa')
}

const HOW_TO_STEPS = [
  'Upload your PDF file using the file selector or drag and drop.',
  'Click "Convert to PDF/A". The conversion runs in your browser; the engine downloads once on first use.',
  'Download your PDF/A compliant file, ready for long-term preservation and archiving.',
]

const FAQS = [
  {
    q: 'What is PDF/A and why is it used?',
    a: 'PDF/A is an ISO-standardized version of PDF (ISO 19005) designed for long-term digital archiving. It ensures documents remain self-contained and reproducible without relying on external fonts, encryption, or proprietary software.',
  },
  {
    q: 'What version of PDF/A does this tool produce?',
    a: 'This tool produces PDF/A-2b (ISO 19005-2, basic conformance). Fonts are embedded and an sRGB output intent is added, so the document renders the same way years from now. PDF/A-2b is widely accepted for archiving and, unlike PDF/A-1, allows transparency and JPEG 2000 images.',
  },
  {
    q: 'Who needs to use PDF/A format?',
    a: 'PDF/A is commonly required by government agencies, courts, healthcare organizations, and financial institutions for regulatory compliance and long-term document storage.',
  },
  {
    q: 'Will my PDF/A file look the same as the original?',
    a: 'In most cases, yes. The visual appearance is preserved. Features PDF/A does not allow, such as JavaScript or embedded media, are removed. Password-protected PDFs must be unlocked first.',
  },
  {
    q: 'Is my PDF uploaded to a server?',
    a: 'No. The conversion runs entirely in your browser using Ghostscript compiled to WebAssembly. Your file never leaves your device, and there is no file size limit beyond your device memory.',
  },
]

export default function PdfToPdfaPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToPdfaClient />
    </ToolLayout>
  )
}
