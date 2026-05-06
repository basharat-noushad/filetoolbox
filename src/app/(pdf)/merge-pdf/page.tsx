import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { MergePdfClient } from './MergePdfClient'

const tool = getToolBySlug('merge-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Merge PDF Online Free — Combine PDF Files | PDF and Image +',
    description: 'Merge multiple PDF files into one document online for free. No registration, no file size limit. Files processed securely in your browser.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Merge PDF Online Free | PDF and Image +',
      description: 'Combine multiple PDF files into one. Free, secure, no sign-up required.',
    },
    twitter: {
      title: 'Merge PDF Online Free | PDF and Image +',
      description: 'Combine multiple PDF files into one. Free, secure, no sign-up required.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Click "Select Files" or drag and drop your PDF files into the upload area.',
  'Arrange the files in the order you want them merged.',
  'Click "Merge PDFs" — your combined PDF will download automatically.',
]

const FAQS = [
  { q: 'How many PDF files can I merge at once?', a: 'You can merge up to 20 PDF files at once with PDF and Image +. All processing happens in your browser — no file size limits.' },
  { q: 'Is it safe to merge PDFs online?', a: 'Yes, completely safe. Your files never leave your device — all merging is done locally in your browser. We never see your files.' },
  { q: 'Will the quality change after merging?', a: 'No. Merging preserves all content, formatting, images, fonts, and quality exactly as in the original files.' },
  { q: 'Can I merge PDFs with different page sizes?', a: 'Yes. Each page keeps its original dimensions when merging PDFs with different page sizes.' },
  { q: 'Do I need an account to merge PDFs?', a: 'No account or registration is ever required. All tools on PDF and Image + are 100% free with no sign-up.' },
]

export default function MergePdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <MergePdfClient />
    </ToolLayout>
  )
}
