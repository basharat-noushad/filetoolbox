import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { withSocialMetadata } from '@/lib/seo'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { AddWatermarkPdfClient } from './AddWatermarkPdfClient'

const tool = getToolBySlug('add-watermark-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Add Watermark to PDF Free — Draft & Confidential Text",
    description: "Add a text watermark to every PDF page for free. Mark drafts or confidential copies, adjust opacity and rotation, then download. No file upload needed.",
    keywords: tool.keywords,
    alternates: { canonical: '/add-watermark-pdf' },
  }, '/add-watermark-pdf')
}

const HOW_TO_STEPS = [
  "Select one PDF up to 50 MB. Keep the original if it is signed or needs to remain unchanged.",
  "Enter short text such as DRAFT or CONFIDENTIAL. Adjust opacity, font size and rotation; the text is added to every page.",
  "Click Add Watermark, then use Download to save watermarked.pdf. Open the result and check every page."
]
const FAQS = [
  {
    "q": "How do I add a draft watermark to a PDF?",
    "a": "Select your PDF, replace the text with DRAFT, and choose a low opacity so the content remains readable. Click Add Watermark and download the new copy."
  },
  {
    "q": "Can I watermark only selected pages or upload a logo?",
    "a": "This tool adds text to every page. It does not support a logo watermark or page selection. Use short text; long labels can run outside the page."
  },
  {
    "q": "Does a watermark stop someone editing or copying my PDF?",
    "a": "No. A watermark is a visible label, not an access control or a digital signature. A PDF editor may remove it. Editing an already signed PDF can affect its signature validity."
  },
  {
    "q": "Is my PDF uploaded, and what is the file limit?",
    "a": "Watermarking runs in your browser without uploading the PDF for processing. Select one file up to 50 MB; large documents may also be limited by device memory."
  },
  {
    "q": "Which watermark characters can I use?",
    "a": "Use short text supported by the built-in Helvetica font, such as DRAFT, CONFIDENTIAL or a Latin-script name. Some scripts and emoji are not supported."
  }
]

export default function Page() {
  return <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}><AddWatermarkPdfClient /></ToolLayout>
}
