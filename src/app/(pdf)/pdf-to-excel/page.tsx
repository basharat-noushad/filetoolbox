import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToExcelClient } from './PdfToExcelClient'

const tool = getToolBySlug('pdf-to-excel')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PDF to Excel Converter Free Online',
    description: 'Convert PDF files to Excel spreadsheets (.xlsx) online for free. Extract tables and data from any PDF. Powered by LibreOffice. No registration.',
    keywords: tool.keywords,
    openGraph: {
      title: 'PDF to Excel Converter Free Online | PDF and Image +',
      description: 'Convert PDF files to Excel spreadsheets (.xlsx) online for free. Extract tables and data from any PDF. Powered by LibreOffice. No registration.',
    },
    twitter: {
      title: 'PDF to Excel Converter Free Online | PDF and Image +',
      description: 'Convert PDF files to Excel spreadsheets (.xlsx) online for free. Extract tables and data from any PDF. Powered by LibreOffice. No registration.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file using the file selector or drag and drop.',
  'Click "Convert to Excel" to start the conversion process.',
  'Download your converted Excel (.xlsx) spreadsheet when the conversion is complete.',
]

const FAQS = [
  {
    q: 'How accurate is the PDF to Excel conversion?',
    a: 'Conversion accuracy depends on how the PDF was created. PDFs with structured tables and text convert well. Scanned PDFs or those with complex layouts may require manual cleanup after conversion.',
  },
  {
    q: 'What happens to my PDF data during conversion?',
    a: 'Your file is sent securely to our conversion server (powered by LibreOffice), converted, and immediately returned to you. Files are not stored after conversion.',
  },
  {
    q: 'Is there a file size limit?',
    a: 'Yes, the maximum file size is 50MB. For larger files, consider splitting your PDF first using our Split PDF tool.',
  },
  {
    q: 'Can I convert a scanned PDF to Excel?',
    a: 'Scanned PDFs contain images rather than text, so direct conversion to Excel will have limited results. For scanned documents, try our OCR PDF tool first to extract text, then copy the data into Excel.',
  },
]

export default function PdfToExcelPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToExcelClient />
    </ToolLayout>
  )
}
