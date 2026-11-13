import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToExcelClient } from './PdfToExcelClient'

const tool = getToolBySlug('pdf-to-excel')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "PDF to Excel Online Free — Convert to XLSX",
    description: "Convert PDF to Excel (.xlsx) online for free. Extracts tables and data, and reads scanned pages with OCR in your browser. Up to 100 MB, no sign-up.",
    keywords: tool.keywords,
    openGraph: {
      title: "PDF to Excel Online Free — Convert to XLSX | PDF and Image +",
      description: 'Convert PDF files to Excel spreadsheets (.xlsx) online for free. Extract tables and data from any PDF.',
    },
    twitter: {
      title: "PDF to Excel Online Free — Convert to XLSX | PDF and Image +",
      description: 'Convert PDF files to Excel spreadsheets (.xlsx) online for free. Extract tables and data from any PDF.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/pdf-to-excel')
}

const HOW_TO_STEPS = [
  'Upload your PDF file using the file selector or drag and drop.',
  'Click "Convert to Excel" to start the conversion process.',
  'Download your converted Excel (.xlsx) spreadsheet when ready.',
]

const FAQS = [
  {
    q: 'How accurate is the PDF to Excel conversion?',
    a: 'Accuracy depends on how the PDF was created. PDFs with well-structured tables and text convert well. Scanned PDFs or those with complex layouts may require manual cleanup after conversion.',
  },
  {
    q: 'What happens to my PDF data during conversion?',
    a: 'The conversion runs in your browser, including reading scanned pages, so the file normally stays on your device. It is sent to our online converter (Adobe PDF Services) only if your browser cannot convert it, a scanned page cannot be read, or you choose to retry online.',
  },
  {
    q: 'Is there a file size limit?',
    a: 'The maximum file size is 100MB. The online converter, used as a backup, accepts files up to 4MB.',
  },
  {
    q: 'Can I convert a scanned PDF to Excel?',
    a: 'Yes. Scanned pages are read with OCR in your browser and the words go into cells. Columns with clear gaps between them usually land in separate cells, but ruled tables in a scan are not rebuilt, so check the result. Pick the language of the scan before converting.',
  },
  {
    q: 'Will formulas be preserved in the converted Excel file?',
    a: 'No. PDF files store the displayed values, not formulas. The output Excel file will contain the numbers as they appeared in the PDF, not the underlying calculations.',
  },
]

export default function PdfToExcelPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToExcelClient />
    </ToolLayout>
  )
}
