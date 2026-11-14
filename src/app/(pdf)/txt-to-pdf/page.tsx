import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { TxtToPdfClient } from './TxtToPdfClient'

const tool = getToolBySlug('txt-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "TXT to PDF Converter Online Free",
    description: "TXT to PDF converter: turn a text file or pasted text into a clean PDF with word wrap and pages. Choose A4 or Letter. Runs in your browser.",
    keywords: tool.keywords,
    openGraph: {
      title: "TXT to PDF Converter Online Free | PDF and Image +",
      description: "TXT to PDF converter: turn a text file or pasted text into a clean PDF with word wrap and pages. Choose A4 or Letter. Runs in your browser.",
    },
    twitter: {
      title: "TXT to PDF Converter Online Free | PDF and Image +",
      description: "TXT to PDF converter: turn a text file or pasted text into a clean PDF with word wrap and pages. Choose A4 or Letter. Runs in your browser.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/txt-to-pdf')
}

const HOW_TO_STEPS = [
  "Upload a .txt file or paste your text into the box.",
  "Choose the page size, font size and margins.",
  "Click \"Convert to PDF\" and download the finished PDF.",
]

const FAQS = [
  { q: "Is this TXT to PDF converter free?", a: "Yes. It is free, needs no account and adds no watermark." },
  { q: "Is my text uploaded to a server?", a: "No. The PDF is built in your browser with pdf-lib, so your text never leaves your device. Fonts for other scripts are loaded from this site only when your text needs them." },
  { q: "Does it support non-English text?", a: "Yes. Latin, Cyrillic and Greek text work, plus Urdu, Arabic and Persian (joined letters, right-aligned), Hindi in Devanagari, and Chinese. Conjuncts in Hindi and small dots or marks in Urdu are placed by a basic layout engine, so check the result for formal documents. Japanese kana mostly works; Korean Hangul and emoji are not supported and become a question mark, and the tool tells you when that happens. Chinese needs a one-time font download of about 10 MB, only when your text contains it." },
  { q: "Can I choose the page size?", a: "Yes: A4 or US Letter, with a font size from 10 to 16 pt and three margin widths." },
  { q: "How are long lines and many pages handled?", a: "Long lines are wrapped at word boundaries and the text flows onto as many pages as needed. Tabs become four spaces and Windows line endings are handled." },
  { q: "Can I make a PDF with formatting such as bold or images?", a: "No. This tool makes plain-text PDFs in one font. For formatted documents use Word to PDF." },
]

export default function TxtToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <TxtToPdfClient />
    </ToolLayout>
  )
}
