import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { MergePdfClient } from './MergePdfClient'

const tool = getToolBySlug('merge-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Merge PDF Online Free — Combine PDF Files",
    description: "Merge PDF files online for free, and add JPG or PNG images too. Combine up to 20 files in your browser. No registration, no uploads.",
    keywords: tool.keywords,
    openGraph: {
      title: 'Merge PDF Online Free | PDF and Image +',
      description: 'Combine multiple PDF files into one. Free, secure, no sign-up required.',
    },
    twitter: {
      title: 'Merge PDF Online Free | PDF and Image +',
      description: 'Combine multiple PDF files into one. Free, secure, no sign-up required.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/merge-pdf')
}

const HOW_TO_STEPS = [
  'Click "Select Files" or drag and drop your PDF files (and JPG or PNG images, if you like) into the upload area.',
  'Select your files in the order you want them merged — they combine in the order you add them.',
  'Click "Merge" — then click Download to save your combined PDF.',
]

const FAQS = [
  { q: 'How many PDF files can I merge at once?', a: 'You can merge up to 20 PDF files at once with PDF and Image +. All processing happens in your browser — up to 50 MB per file, subject to device memory.' },
  { q: 'Can I merge PDF with JPG or PNG images?', a: 'Yes. Add JPG or PNG files alongside your PDFs. Each image becomes one page in the output, sized to the image itself (not fitted to A4), in the order you added the files.' },
  { q: 'Is it safe to merge PDFs online?', a: 'Merging happens locally. Your files never leave your device — all merging is done locally in your browser. We never see your files.' },
  { q: 'Will the quality change after merging?', a: 'Copied pages keep their dimensions and content. Check forms, bookmarks and signatures separately; merging may affect document-level features.' },
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
