import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { withSocialMetadata } from '@/lib/seo'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { AddWatermarkImageClient } from './AddWatermarkImageClient'

const tool = getToolBySlug('add-watermark-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Add Watermark to JPG, PNG & WebP Online Free",
    description: "Add a text watermark to JPG, PNG or WebP photos free in your browser. Choose a corner or center position and adjust opacity. One image up to 50 MB.",
    keywords: tool.keywords,
    alternates: { canonical: '/add-watermark-image' },
  }, '/add-watermark-image')
}

const HOW_TO_STEPS = [
  "Select one JPG, PNG or WebP image up to 50 MB.",
  "Enter your watermark text, choose the center or a corner, and adjust opacity from 10% to 90%.",
  "Click Add Watermark, then Download to save a copy. Check that the text fits and remains legible."
]
const FAQS = [
  {
    "q": "How do I add a watermark to a JPG?",
    "a": "Select your JPG, type your name or copyright text, choose its position and opacity, then click Add Watermark. Download the result; your original file is unchanged."
  },
  {
    "q": "Can I add a logo or watermark photos in bulk?",
    "a": "This tool adds text to one image at a time. It does not upload logo files or apply watermarks to a batch. Font size is selected automatically from the image width."
  },
  {
    "q": "Does adding a watermark reduce image quality?",
    "a": "The image keeps its pixel dimensions, but it is re-encoded when exported. JPG and WebP output may lose some detail. Compare the downloaded copy with the original before publishing."
  },
  {
    "q": "Are my photos uploaded to a server?",
    "a": "No file upload is needed for this tool. Watermarking happens in your browser. The site separately uses analytics and advertising as described in the privacy policy."
  },
  {
    "q": "Can someone remove the watermark?",
    "a": "A visible watermark can help identify your work, but it cannot prevent cropping, retouching or copying. Keep the original and avoid putting the mark over important detail."
  }
]

export default function Page() {
  return <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}><AddWatermarkImageClient /></ToolLayout>
}
