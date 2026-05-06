import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { OcrPdfClient } from './OcrPdfClient'

const tool = getToolBySlug('ocr-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'OCR PDF — Extract Text from Scanned PDF Free | PDF and Image +',
    description: 'Extract text from scanned PDF files using OCR technology. Convert image-based PDFs to searchable, copyable text. Free online OCR tool.',
    keywords: tool.keywords,
    openGraph: {
      title: 'OCR PDF — Extract Text from Scanned PDF Free | PDF and Image +',
      description: 'Extract text from scanned PDF files using OCR technology. Convert image-based PDFs to searchable, copyable text. Free online OCR tool.',
    },
    twitter: {
      title: 'OCR PDF — Extract Text from Scanned PDF Free | PDF and Image +',
      description: 'Extract text from scanned PDF files using OCR technology. Convert image-based PDFs to searchable, copyable text. Free online OCR tool.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your scanned PDF file using the file selector or drag and drop.',
  'Select the language of the text in your document from the dropdown menu.',
  'Click "Extract Text" and wait while OCR processes each page, then copy or download the result.',
]

const FAQS = [
  {
    q: 'What is OCR and how does it work?',
    a: 'OCR (Optical Character Recognition) analyzes images of text and converts them into machine-readable characters. Our tool renders each PDF page as an image, then uses Tesseract.js to recognize the text — all inside your browser.',
  },
  {
    q: 'Will OCR work on any scanned PDF?',
    a: 'OCR works best on clearly scanned, high-contrast documents. Handwritten text, low-resolution scans, or pages with complex layouts may produce less accurate results.',
  },
  {
    q: 'Which languages are supported?',
    a: 'The tool supports English, Spanish, French, German, and Simplified Chinese. Select the appropriate language before extracting for best accuracy.',
  },
  {
    q: 'Is my PDF file sent to any server?',
    a: 'No. All OCR processing runs locally in your browser using Tesseract.js and PDF.js. Your file is never uploaded or transmitted anywhere.',
  },
  {
    q: 'Can I extract text from a multi-page PDF?',
    a: 'Yes. The tool processes every page of your PDF and concatenates all extracted text into a single result that you can copy or download as a .txt file.',
  },
]

export default function OcrPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <OcrPdfClient />
    </ToolLayout>
  )
}
