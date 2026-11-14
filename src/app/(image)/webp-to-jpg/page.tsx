import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ToJpgClient } from '../png-to-jpg/ToJpgClient'

const tool = getToolBySlug('webp-to-jpg')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "WebP to JPG Converter Online Free",
    description: "Convert WebP to JPG online free. Pick the quality, batch convert many files to a ZIP, and get images that open in any app. Runs in your browser.",
    keywords: tool.keywords,
    openGraph: {
      title: "WebP to JPG Converter Online Free | PDF and Image +",
      description: "Convert WebP to JPG online free. Pick the quality, batch convert many files to a ZIP, and get images that open in any app. Runs in your browser.",
    },
    twitter: {
      title: "WebP to JPG Converter Online Free | PDF and Image +",
      description: "Convert WebP to JPG online free. Pick the quality, batch convert many files to a ZIP, and get images that open in any app. Runs in your browser.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/webp-to-jpg')
}

const HOW_TO_STEPS = [
  "Add one or more .webp files by clicking \"Select Files\" or dropping them into the upload area.",
  "Set the JPG quality slider. 85% is a good default for photos.",
  "Click \"Convert to JPG\" and download the file, or a ZIP when you added several images.",
]

const FAQS = [
  { q: "Why do some apps and websites reject WebP images?", a: "WebP is a newer format from Google. Older versions of Photoshop, many email clients, print shops, and upload forms only accept JPG or PNG, so a WebP saved from the web often gets refused. Converting to JPG makes it open anywhere." },
  { q: "Does converting WebP to JPG reduce quality?", a: "JPG is lossy, so a small amount of detail is lost on every save. At 85% or higher the difference is hard to see on photos. If the WebP was lossless and you need exact pixels, use WebP to PNG instead." },
  { q: "What happens to transparency in a WebP image?", a: "JPG cannot store transparency, so transparent pixels are filled with white. If you need to keep the transparent background, convert to PNG." },
  { q: "Can I convert animated WebP files?", a: "Only the first frame is converted, because a JPG is a single still image." },
  { q: "Why is my JPG bigger than the original WebP?", a: "WebP compresses more efficiently than JPG at the same visual quality, so the JPG is often 25-35% larger. Lower the quality slider if size matters more than detail." },
  { q: "Are my images uploaded anywhere?", a: "No. The conversion runs inside your browser and the files never leave your device." },
]

export default function WebpToJpgPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ToJpgClient accept={{ 'image/webp': ['.webp'] }} sourceLabel="WebP" />
    </ToolLayout>
  )
}
