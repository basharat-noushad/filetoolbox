import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ExcelToPdfClient } from './ExcelToPdfClient'

const tool = getToolBySlug('excel-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: 'Excel to PDF Converter Free Online — XLSX to PDF',
    description: 'Convert Excel spreadsheets (.xlsx, .xls) to PDF format online for free. Preserves all formatting and layout. No registration needed.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Excel to PDF Converter Free Online — XLSX to PDF | PDF and Image +',
      description: 'Convert Excel spreadsheets (.xlsx, .xls) to PDF format online for free. Preserves all formatting and layout.',
    },
    twitter: {
      title: 'Excel to PDF Converter Free Online — XLSX to PDF | PDF and Image +',
      description: 'Convert Excel spreadsheets (.xlsx, .xls) to PDF format online for free. Preserves all formatting and layout.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/excel-to-pdf')
}

const HOW_TO_STEPS = [
  'Upload your Excel file (.xlsx or .xls) using the file selector or drag and drop.',
  'Click "Convert to PDF" to start the conversion process.',
  'Download your converted PDF file when the conversion is complete.',
]

const FAQS = [
  {
    q: 'Will the formatting be preserved when converting Excel to PDF?',
    a: 'Yes. The converter preserves cell formatting, borders, colors, and page layout as accurately as possible. Complex conditional formatting or macros may not translate, but the visual output is preserved.',
  },
  {
    q: 'Can I convert Excel files with multiple sheets?',
    a: 'Yes. All sheets in your workbook are included in the PDF. Each sheet becomes a separate section in the document.',
  },
  {
    q: 'Is there a maximum file size?',
    a: 'The maximum file size is 4MB. Most Excel spreadsheets are well within this limit.',
  },
  {
    q: 'Is my Excel file stored on your servers?',
    a: "Your file is sent to a processing service. Temporary storage and retention depend on the configured service. Review the privacy policy before uploading sensitive files.",
  },
  {
    q: 'What Excel formats are supported?',
    a: 'Both .xlsx (Excel 2007 and later) and .xls (Excel 97-2003) formats are supported.',
  },
]

export default function ExcelToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ExcelToPdfClient />
    </ToolLayout>
  )
}
