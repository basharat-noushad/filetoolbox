import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PptToPdfClient } from './PptToPdfClient'

const tool = getToolBySlug('ppt-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "PPT to PDF Online Free — Convert PowerPoint",
    description: "PPT to PDF online for free: convert .pptx and .ppt presentations. Each slide becomes a page with selectable text. Up to 100 MB, no sign-up.",
    keywords: tool.keywords,
    openGraph: {
      title: "PPT to PDF Online Free — Convert PowerPoint | PDF and Image +",
      description: 'Convert PowerPoint presentations (.pptx, .ppt) to PDF online for free. All slides preserved.',
    },
    twitter: {
      title: "PPT to PDF Online Free — Convert PowerPoint | PDF and Image +",
      description: 'Convert PowerPoint presentations (.pptx, .ppt) to PDF online for free. All slides preserved.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/ppt-to-pdf')
}

const HOW_TO_STEPS = [
  'Upload your PowerPoint file (.pptx or .ppt) using the file selector or drag and drop.',
  'Click "Convert to PDF" to start the conversion process.',
  'Download your converted PDF — each slide becomes a page in the PDF.',
]

const FAQS = [
  {
    q: 'Will slide animations and transitions appear in the PDF?',
    a: 'No. PDFs are static documents, so animations and transitions are not included. Each slide becomes one page, and its text stays selectable.',
  },
  {
    q: 'Are embedded images and charts preserved?',
    a: 'Yes. All images, charts, shapes, and text formatting are preserved in the PDF output as accurately as possible.',
  },
  {
    q: 'What is the maximum file size I can convert?',
    a: 'The maximum file size is 100MB. The online converter, used as a backup, accepts files up to 4MB.',
  },
  {
    q: 'Is my presentation file kept private?',
    a: "Usually it never leaves your device. The conversion runs in your browser. Only a file your browser cannot convert, or one you choose to retry online, is sent to our online converter (Adobe PDF Services). See the privacy policy for how long that service keeps files.",
  },
  {
    q: 'What PowerPoint formats are supported?',
    a: 'Both .pptx (PowerPoint 2007 and later) and the older .ppt format are supported.',
  },
]

export default function PptToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PptToPdfClient />
    </ToolLayout>
  )
}
