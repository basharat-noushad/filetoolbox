import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ExcelToPdfClient } from './ExcelToPdfClient'

const tool = getToolBySlug('excel-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Excel to PDF Online Free — Convert XLSX to PDF",
    description: "Excel to PDF online for free: convert .xlsx and .xls files. All sheets are included, with formatting and layout kept as closely as possible. No sign-up.",
    keywords: tool.keywords,
    openGraph: {
      title: "Excel to PDF Online Free — Convert XLSX to PDF | PDF and Image +",
      description: 'Convert Excel spreadsheets (.xlsx, .xls) to PDF format online for free. Preserves all formatting and layout.',
    },
    twitter: {
      title: "Excel to PDF Online Free — Convert XLSX to PDF | PDF and Image +",
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
    a: 'The maximum file size is 100MB. The online converter, used as a backup, accepts files up to 4MB.',
  },
  {
    q: 'Is my Excel file stored on your servers?',
    a: "Usually it never reaches them. The conversion runs in your browser and the file stays on your device. Only a file your browser cannot convert, or one you choose to retry online, is sent to our online converter (Adobe PDF Services). See the privacy policy for how long that service keeps files.",
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
