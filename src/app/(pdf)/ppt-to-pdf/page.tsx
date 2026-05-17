import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PptToPdfClient } from './PptToPdfClient'

const tool = getToolBySlug('ppt-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PowerPoint to PDF Converter Free Online — PPTX to PDF',
    description: 'Convert PowerPoint presentations (.pptx, .ppt) to PDF format online for free. All slides preserved with perfect formatting. No registration needed.',
    keywords: tool.keywords,
    openGraph: {
      title: 'PowerPoint to PDF Converter Free Online — PPTX to PDF | PDF and Image +',
      description: 'Convert PowerPoint presentations (.pptx, .ppt) to PDF online for free. All slides preserved.',
    },
    twitter: {
      title: 'PowerPoint to PDF Converter Free Online — PPTX to PDF | PDF and Image +',
      description: 'Convert PowerPoint presentations (.pptx, .ppt) to PDF online for free. All slides preserved.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PowerPoint file (.pptx or .ppt) using the file selector or drag and drop.',
  'Click "Convert to PDF" to start the conversion process.',
  'Download your converted PDF — each slide becomes a page in the PDF.',
]

const FAQS = [
  {
    q: 'Will slide animations and transitions appear in the PDF?',
    a: 'No. PDFs are static documents, so animations and transitions are not included. Each slide is captured as a static image in the PDF output.',
  },
  {
    q: 'Are embedded images and charts preserved?',
    a: 'Yes. All images, charts, shapes, and text formatting are preserved in the PDF output as accurately as possible.',
  },
  {
    q: 'What is the maximum file size I can convert?',
    a: 'The maximum file size is 50MB. Presentations with many high-resolution images may be large — compress images in PowerPoint beforehand if needed.',
  },
  {
    q: 'Is my presentation file kept private?',
    a: 'Your file is sent to our conversion server only for processing and is immediately deleted afterward. We never store or access your presentation content.',
  },
  {
    q: 'What PowerPoint formats are supported?',
    a: 'Both .pptx (PowerPoint 2007 and later) and the older .ppt format are supported.',
  },
]

export default function PptToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PptToPdfClient />
    </ToolLayout>
  )
}
