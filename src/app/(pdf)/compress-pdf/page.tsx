import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { withSocialMetadata } from '@/lib/seo'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { CompressPdfClient } from './CompressPdfClient'

const tool = getToolBySlug('compress-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Compress PDF to 100KB, 200KB, 1MB Online",
    description: "Compress a PDF online for free. Use lossless mode to keep text, or pick a target size like 200 KB or 1 MB for email. Runs in your browser.",
    keywords: tool.keywords,
    alternates: { canonical: '/compress-pdf' },
  }, '/compress-pdf')
}

const HOW_TO_STEPS = [
  "Select one PDF up to 50 MB. Keep your original document, especially if it contains signatures.",
  "Choose Lossless to keep text selectable, or Target size and pick 100 KB, 200 KB, 500 KB, 1 MB, 2 MB or a custom value.",
  "Click compress, check the reported size, and download compressed.pdf. If the target is out of reach, you get the smallest result and its size."
]
const FAQS = [
  {
    "q": "How do I compress a PDF to 200 KB?",
    "a": "Choose Target size, select 200 KB and compress. The tool re-renders each page as a JPEG and lowers resolution and quality over several passes until the file fits. Very long or image-heavy PDFs may not reach 200 KB; you then get the smallest result and its actual size."
  },
  {
    "q": "Can I compress a PDF for email?",
    "a": "Yes. Most email services allow attachments of 20 to 25 MB, so 1 MB or 2 MB is usually plenty and keeps pages readable. Use 100 KB or 200 KB only for strict upload forms."
  },
  {
    "q": "What do I lose in Target size mode?",
    "a": "Pages become images. Text is no longer selectable or searchable, and links, bookmarks and form fields are removed. Page sizes stay the same. Use Lossless mode if you need to keep text."
  },
  {
    "q": "Why is my PDF not getting smaller in Lossless mode?",
    "a": "Lossless mode only rewrites the PDF structure and does not touch images. Many PDFs and scans are already compact, so the tool keeps the original when there is no gain. Switch to Target size for a stronger reduction."
  },
  {
    "q": "Is my PDF uploaded anywhere?",
    "a": "No. Both modes run in your browser and the file never leaves your device. Very large PDFs may be slow or run out of memory on phones."
  },
  {
    "q": "Can I compress a password-protected PDF?",
    "a": "Not directly. Remove the password first with the Unlock PDF tool, if you are authorized to modify the file, then compress the unlocked copy."
  }
]

export default function Page() {
  return <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}><CompressPdfClient /></ToolLayout>
}
