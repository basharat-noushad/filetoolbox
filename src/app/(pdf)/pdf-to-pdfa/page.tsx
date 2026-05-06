import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToPdfaClient } from './PdfToPdfaClient'

const tool = getToolBySlug('pdf-to-pdfa')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PDF to PDF/A Converter Free Online | PDF and Image +',
    description: 'Convert PDF files to PDF/A format for long-term archiving. Meets ISO 19005 standard. Free online PDF/A converter. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'PDF to PDF/A Converter Free Online | PDF and Image +',
      description: 'Convert PDF files to PDF/A format for long-term archiving. Meets ISO 19005 standard. Free online PDF/A converter. No registration required.',
    },
    twitter: {
      title: 'PDF to PDF/A Converter Free Online | PDF and Image +',
      description: 'Convert PDF files to PDF/A format for long-term archiving. Meets ISO 19005 standard. Free online PDF/A converter. No registration required.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file using the file selector or drag and drop.',
  'Click "Convert to PDF/A" to start the archival conversion process.',
  'Download your PDF/A compliant file, ready for long-term preservation and archiving.',
]

const FAQS = [
  {
    q: 'What is PDF/A and why is it used?',
    a: 'PDF/A is an ISO-standardized version of PDF (ISO 19005) designed for long-term digital archiving. It ensures documents remain self-contained and reproducible without relying on external fonts, encryption, or proprietary software.',
  },
  {
    q: 'What version of PDF/A does this tool produce?',
    a: 'This tool produces PDF/A-1b compliant documents, which is the most widely accepted standard for archival purposes, ensuring basic visual reproducibility over time.',
  },
  {
    q: 'Who needs to use PDF/A format?',
    a: 'PDF/A is commonly required by government agencies, courts, healthcare organizations, and financial institutions for regulatory compliance and long-term document storage.',
  },
  {
    q: 'Will my PDF/A file look the same as the original?',
    a: 'In most cases, yes. The visual appearance is preserved. However, some features incompatible with PDF/A (like encryption, JavaScript, and certain transparency effects) may be modified during conversion.',
  },
  {
    q: 'Is my PDF file stored after conversion?',
    a: 'No. Your file is processed server-side and immediately deleted after you download the converted PDF/A. We do not retain any uploaded files.',
  },
]

export default function PdfToPdfaPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToPdfaClient />
    </ToolLayout>
  )
}
