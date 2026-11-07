import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { withSocialMetadata } from '@/lib/seo'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { CompressPdfClient } from './CompressPdfClient'

const tool = getToolBySlug('compress-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Compress PDF Online Free — Reduce PDF File Size",
    description: "Try lossless PDF structure compression online for free. Keep text and images intact, compare file sizes and download the smaller result. Up to 50 MB.",
    keywords: tool.keywords,
    alternates: { canonical: '/compress-pdf' },
  }, '/compress-pdf')
}

const HOW_TO_STEPS = [
  "Select one PDF up to 50 MB. Keep your original document, especially if it contains signatures.",
  "Click Compress PDF to rewrite the PDF structure using object streams. Text and images are not rasterized or downsampled.",
  "Check the reported size change and download the result. If there is no reduction, the tool returns your original file."
]
const FAQS = [
  {
    "q": "Can I compress a PDF to 200 KB, 500 KB or 1 MB?",
    "a": "This tool cannot guarantee a target size. It optimizes PDF structure rather than resizing embedded images. For a strict upload limit, remove unnecessary pages or split the document if the recipient allows separate files."
  },
  {
    "q": "Does this PDF compressor reduce image quality?",
    "a": "It does not downsample images or turn text into pictures. It rewrites the PDF structure with object streams. Keep the original: rewriting a PDF may affect digital signatures or specialized document features."
  },
  {
    "q": "Why is my PDF not getting smaller?",
    "a": "Many PDFs already use compressed structures, and scans are often dominated by image data. The tool keeps the original if rewriting does not reduce its size. There is no fixed percentage saving."
  },
  {
    "q": "What is the file size limit?",
    "a": "You can select one PDF up to 50 MB. Browser memory can impose a practical limit on complex files. Processing happens locally without uploading the PDF."
  },
  {
    "q": "Can I compress a password-protected PDF?",
    "a": "Unlock a PDF you own and are authorized to modify before compressing it. The Unlock PDF tool uses a processing server, unlike this browser-based compressor."
  }
]

export default function Page() {
  return <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}><CompressPdfClient /></ToolLayout>
}
