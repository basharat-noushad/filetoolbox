import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ExcelToPdfClient } from './ExcelToPdfClient'

const tool = getToolBySlug('excel-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Excel to PDF Converter Free Online | PDF and Image +',
    description: 'Convert Excel spreadsheets (.xlsx, .xls) to PDF format online for free. Preserves all formatting and layout. Powered by LibreOffice. No sign-up.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Excel to PDF Converter Free Online | PDF and Image +',
      description: 'Convert Excel spreadsheets (.xlsx, .xls) to PDF format online for free. Preserves all formatting and layout. Powered by LibreOffice. No sign-up.',
    },
    twitter: {
      title: 'Excel to PDF Converter Free Online | PDF and Image +',
      description: 'Convert Excel spreadsheets (.xlsx, .xls) to PDF format online for free. Preserves all formatting and layout. Powered by LibreOffice. No sign-up.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your Excel file (.xlsx or .xls) using the file selector or drag and drop.',
  'Click "Convert to PDF" to start the conversion process.',
  'Download your converted PDF file when the conversion is complete.',
]

const FAQS = [
  {
    q: 'Will the formatting be preserved when converting Excel to PDF?',
    a: 'Yes. Our converter uses LibreOffice, which preserves cell formatting, borders, colors, formulas display, and page layout as accurately as possible.',
  },
  {
    q: 'Can I convert Excel files with multiple sheets?',
    a: 'Yes. All sheets in your workbook will be included in the converted PDF. Each sheet becomes a separate section in the PDF document.',
  },
  {
    q: 'Is there a maximum file size?',
    a: 'The maximum file size is 50MB. Most Excel spreadsheets are well within this limit.',
  },
  {
    q: 'Is my Excel file stored on your servers?',
    a: 'No. Your file is processed by our conversion server and immediately deleted after your PDF is generated. We do not store any of your files.',
  },
]

export default function ExcelToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ExcelToPdfClient />
    </ToolLayout>
  )
}
