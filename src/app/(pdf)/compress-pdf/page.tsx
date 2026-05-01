import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { CompressPdfClient } from './CompressPdfClient'

const tool = getToolBySlug('compress-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Compress PDF Online Free — Reduce PDF Size | FileToolBox',
    description: 'Compress PDF files online for free. Reduce PDF file size without losing quality. No registration needed. 100% browser-based.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Compress PDF Online Free — Reduce PDF Size | FileToolBox',
      description: 'Compress PDF files online for free. Reduce PDF file size without losing quality. No registration needed. 100% browser-based.',
    },
    twitter: {
      title: 'Compress PDF Online Free — Reduce PDF Size | FileToolBox',
      description: 'Compress PDF files online for free. Reduce PDF file size without losing quality. No registration needed. 100% browser-based.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Click "Select File" or drag and drop your PDF into the upload area.',
  'Choose your compression level — Low, Medium, or High.',
  'Click "Compress PDF" and download your smaller file.',
]

const FAQS = [
  { q: 'How much can I reduce my PDF file size?', a: 'Typical compression achieves 20-80% size reduction depending on the PDF content. PDFs with many images compress the most.' },
  { q: 'Will compression affect the quality?', a: 'Low and Medium compression preserve quality well. High compression may slightly reduce image quality but keeps text sharp.' },
  { q: 'Is there a file size limit?', a: 'No file size limit. All processing is done in your browser, so you are only limited by your device memory.' },
  { q: 'What happens to my PDF after compression?', a: 'Your file is processed entirely in your browser. It never leaves your device. We have zero access to your files.' },
]

export default function CompressPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <CompressPdfClient />
    </ToolLayout>
  )
}
