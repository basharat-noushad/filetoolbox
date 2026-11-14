import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PdfToTextClient } from './PdfToTextClient'

const tool = getToolBySlug('pdf-to-text')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "PDF to Text Converter Online Free",
    description: "PDF to text converter that extracts the text from any PDF in your browser. Copy it or download a UTF-8 .txt file. Nothing is uploaded.",
    keywords: tool.keywords,
    openGraph: {
      title: "PDF to Text Converter Online Free | PDF and Image +",
      description: "PDF to text converter that extracts the text from any PDF in your browser. Copy it or download a UTF-8 .txt file. Nothing is uploaded.",
    },
    twitter: {
      title: "PDF to Text Converter Online Free | PDF and Image +",
      description: "PDF to text converter that extracts the text from any PDF in your browser. Copy it or download a UTF-8 .txt file. Nothing is uploaded.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/pdf-to-text')
}

const HOW_TO_STEPS = [
  "Upload the PDF you want to extract text from.",
  "Click \"Extract Text\" and the tool reads every page directly in your browser.",
  "Copy the text or download it as a .txt file. Turn page separators on or off first if you like.",
]

const FAQS = [
  { q: "Is this PDF to text converter free?", a: "Yes. It is free with no sign-up, no watermark and no page limit beyond your browser's memory." },
  { q: "Is my PDF uploaded anywhere?", a: "No. The text is read from the file locally with PDF.js, so the PDF never leaves your device." },
  { q: "Why did I get little or no text?", a: "The PDF is probably a scan or a photo, which contains images of text rather than real text. Use our OCR PDF tool to read scanned pages instead." },
  { q: "Will the layout be preserved?", a: "Lines and paragraphs are rebuilt from the position of each word, so normal documents read well. Tables and multi-column pages can come out with columns interleaved, because .txt has no layout." },
  { q: "Can I convert a password-protected PDF to text?", a: "Not directly. Remove the password first with our Unlock PDF tool (you need to know the password), then extract the text." },
  { q: "What encoding is the .txt file?", a: "UTF-8, so accented letters and non-Latin scripts are kept as long as the PDF stores them as real text." },
]

export default function PdfToTextPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PdfToTextClient />
    </ToolLayout>
  )
}
