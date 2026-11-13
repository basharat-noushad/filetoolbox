import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToPptClient } from './PdfToPptClient'

const tool = getToolBySlug('pdf-to-ppt')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "PDF to PPT Online Free — Convert to PowerPoint",
    description: "PDF to PPT online for free: each PDF page becomes an editable PowerPoint (.pptx) slide. Text-based pages stay editable. Up to 100 MB.",
    keywords: tool.keywords,
    openGraph: {
      title: 'PDF to PowerPoint Converter Free Online | PDF and Image +',
      description: "PDF to PPT online for free: each PDF page becomes an editable PowerPoint (.pptx) slide. Text-based pages stay editable. Up to 100 MB.",
    },
    twitter: {
      title: 'PDF to PowerPoint Converter Free Online | PDF and Image +',
      description: "PDF to PPT online for free: each PDF page becomes an editable PowerPoint (.pptx) slide. Text-based pages stay editable. Up to 100 MB.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/pdf-to-ppt')
}

const HOW_TO_STEPS = [
  'Upload your PDF file using the file selector or drag and drop.',
  'Click "Convert to PowerPoint" to start the conversion.',
  'Download your .pptx file — each page of the PDF becomes a slide in your presentation.',
]

const FAQS = [
  {
    q: 'Will the text in my PDF be editable in PowerPoint?',
    a: 'Usually, yes. Text-based PDFs produce editable text in PowerPoint. Scanned pages are read with OCR in your browser and also become editable text. Pictures with no readable text stay as images.',
  },
  {
    q: 'How many pages can my PDF have?',
    a: 'There is no strict page limit, but very large PDFs may take longer to convert. Each page of the PDF becomes one slide in the PowerPoint presentation.',
  },
  {
    q: 'Is there a file size limit?',
    a: 'The maximum file size is 100MB. The online converter, used as a backup, accepts files up to 4MB.',
  },
  {
    q: 'Is my PDF file secure during conversion?',
    a: 'Yes. The conversion runs in your browser, including reading scanned pages, so the file normally stays on your device. It is sent to our online converter (Adobe PDF Services) only if your browser cannot convert it, a scanned page cannot be read, or you choose to retry online.',
  },
]

export default function PdfToPptPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToPptClient />
    </ToolLayout>
  )
}
