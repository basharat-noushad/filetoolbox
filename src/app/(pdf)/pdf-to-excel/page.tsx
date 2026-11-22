import Link from 'next/link'
import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToExcelClient } from './PdfToExcelClient'

const tool = getToolBySlug('pdf-to-excel')!
const title = 'PDF to Excel Converter – Extract Tables to XLSX'
const description = 'Convert PDF tables to Excel (.xlsx) for free. Use OCR for scanned pages, then check the rows, columns and numbers in the exported workbook.'

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title,
    description,
    keywords: tool.keywords,
    openGraph: {
      title: `${title} | PDF and Image`,
      description,
    },
    twitter: {
      title: `${title} | PDF and Image`,
      description,
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/pdf-to-excel')
}

const HOW_TO_STEPS = [
  'Select a PDF that contains a table. If it is a scan, choose the document language so OCR can read it.',
  'Click "Convert to Excel", then download and open the .xlsx workbook.',
  'Compare the column headers, row count and a few totals with the PDF before using the spreadsheet.',
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
    <ToolLayout tool={tool} howToTitle="How to convert PDF tables to Excel" howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToExcelClient />
      <section className="mt-8 space-y-3" aria-labelledby="sample-table">
        <h2 id="sample-table" className="text-xl font-semibold">Try a PDF table with three columns</h2>
        <p>Open the sample PDF and compare it with the workbook. The notebook row should show 3 units and a total of 18. The pencil row should show 5 units and a total of 10. Check that Units and Total land in separate columns and that the two totals add up to 28 in Excel.</p>
        <div className="flex flex-wrap gap-4 text-brand-700 underline">
          <a href="/examples/supplies.pdf" download>Download the sample PDF</a>
          <a href="/examples/supplies.xlsx" download>Compare the converted workbook</a>
        </div>
        <p>For a scan, check column alignment and decimal points after OCR. <Link className="text-brand-700 underline" href="/blog/how-to-convert-pdf-tables-to-excel-free">Read the PDF table extraction guide</Link>.</p>
      </section>
    </ToolLayout>
  )
}
