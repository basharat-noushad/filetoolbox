import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToPptClient } from './PdfToPptClient'

const tool = getToolBySlug('pdf-to-ppt')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PDF to PowerPoint Converter Free Online | PDF and Image +',
    description: 'Convert PDF files to editable PowerPoint presentations (.pptx) online for free. Each PDF page becomes a slide. No registration required.',
    keywords: tool.keywords,
    openGraph: {
      title: 'PDF to PowerPoint Converter Free Online | PDF and Image +',
      description: 'Convert PDF files to editable PowerPoint presentations (.pptx) online for free. Each PDF page becomes a slide. No registration required.',
    },
    twitter: {
      title: 'PDF to PowerPoint Converter Free Online | PDF and Image +',
      description: 'Convert PDF files to editable PowerPoint presentations (.pptx) online for free. Each PDF page becomes a slide. No registration required.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file using the file selector or drag and drop.',
  'Click "Convert to PowerPoint" to start the conversion.',
  'Download your .pptx file — each page of the PDF becomes a slide in your presentation.',
]

const FAQS = [
  {
    q: 'Will the text in my PDF be editable in PowerPoint?',
    a: 'This depends on the PDF. Text-based PDFs generally produce editable text in PowerPoint. Scanned or image-based PDFs will produce slides with images rather than editable text.',
  },
  {
    q: 'How many pages can my PDF have?',
    a: 'There is no strict page limit, but very large PDFs may take longer to convert. Each page of the PDF becomes one slide in the PowerPoint presentation.',
  },
  {
    q: 'Is there a file size limit?',
    a: 'Yes, the maximum file size is 50MB. Use our Compress PDF tool first if your file is too large.',
  },
  {
    q: 'Is my PDF file secure during conversion?',
    a: 'Yes. Your file is transmitted securely and deleted from our servers immediately after conversion. We do not retain any of your documents.',
  },
]

export default function PdfToPptPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToPptClient />
    </ToolLayout>
  )
}
