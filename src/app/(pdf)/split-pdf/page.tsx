import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { SplitPdfClient } from './SplitPdfClient'

const tool = getToolBySlug('split-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Split PDF Online Free — By Pages or File Size",
    description: "Split PDF by page range, every N pages or max file size (2, 5, 10 MB) online for free. Runs in your browser, no upload, no registration.",
    keywords: tool.keywords,
    openGraph: {
      title: "Split PDF Online Free — By Pages or File Size | PDF and Image +",
      description: "Split PDF by page range, every N pages or max file size (2, 5, 10 MB) online for free. Runs in your browser, no upload, no registration.",
    },
    twitter: {
      title: "Split PDF Online Free — By Pages or File Size | PDF and Image +",
      description: "Split PDF by page range, every N pages or max file size (2, 5, 10 MB) online for free. Runs in your browser, no upload, no registration.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/split-pdf')
}

const HOW_TO_STEPS = [
  'Upload your PDF file by clicking "Select File" or dragging and dropping.',
  'Choose a mode: page ranges (e.g. "1-3, 5, 7-9"), every N pages, or a maximum file size per part.',
  'Click "Split PDF" and download your split file: a ZIP of parts, or a single PDF if there is only one part.',
]

const FAQS = [
  { q: 'How do I split a PDF by file size?', a: 'Choose "By file size" and pick a maximum such as 2, 5, 10 or 20 MB (or type your own). Pages are added to each part in order until the next page would push it over the limit, so every part stays under it.' },
  { q: 'How do I split a PDF into single pages?', a: 'Choose "Every N pages" and enter 1. Every page becomes its own PDF. Enter 7 to get parts of 7 pages each; the last part holds whatever pages remain.' },
  { q: 'What if one page is bigger than my size limit?', a: 'A single page cannot be divided, so it is saved alone in its own part and we tell you which page it was. All other parts stay under the limit.' },
  { q: 'How do I specify page ranges?', a: 'Enter ranges like "1-3, 5, 7-9". Each range creates a separate PDF. A single number (e.g. "5") extracts just that page.' },
  { q: 'What format is the output?', a: 'Each part is a PDF named part_1.pdf, part_2.pdf and so on, bundled in one ZIP. If there is only one part you get a plain PDF instead. Sizes use 1 MB = 1,000,000 bytes.' },
  { q: 'Can I split a password-protected PDF?', a: 'Not directly. Remove the password first with our Unlock PDF tool, then split the unlocked file. Everything runs in your browser, so your file is never uploaded.' },
]

export default function SplitPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <SplitPdfClient />
    </ToolLayout>
  )
}
