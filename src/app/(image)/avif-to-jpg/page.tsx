import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ToJpgClient } from '../png-to-jpg/ToJpgClient'

const tool = getToolBySlug('avif-to-jpg')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "AVIF to JPG Converter Online Free",
    description: "Convert AVIF to JPG online for free. Turn AVIF photos into JPG files that open everywhere, in batches, right in your browser with no upload.",
    keywords: tool.keywords,
    openGraph: {
      title: "AVIF to JPG Converter Online Free | PDF and Image +",
      description: "Convert AVIF to JPG online for free. Turn AVIF photos into JPG files that open everywhere, in batches, right in your browser with no upload.",
    },
    twitter: {
      title: "AVIF to JPG Converter Online Free | PDF and Image +",
      description: "Convert AVIF to JPG online for free. Turn AVIF photos into JPG files that open everywhere, in batches, right in your browser with no upload.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/avif-to-jpg')
}

const HOW_TO_STEPS = [
  "Select your .avif files or drag them into the upload area.",
  "Choose a JPG quality. Higher values keep more detail and make bigger files.",
  "Click \"Convert to JPG\" to get a JPG, or a ZIP when you converted more than one file.",
]

const FAQS = [
  { q: "What is an AVIF file?", a: "AVIF is an image format based on the AV1 video codec. It stores photos at a much smaller size than JPG with similar looks, and supports transparency and HDR." },
  { q: "Why do websites serve AVIF images?", a: "Smaller files load faster, so sites and CDNs serve AVIF to browsers that support it. When you save such an image you may end up with an .avif file your other software cannot open." },
  { q: "Which browsers can open AVIF?", a: "Current Chrome, Edge, Firefox, and Safari 16 or later decode AVIF. This converter uses your browser to read the file, so on an older browser you will see an error instead of a result." },
  { q: "Will the JPG look the same as the AVIF?", a: "Close, but not identical. JPG is a less efficient format, so the JPG will be larger for the same look, and any transparency is replaced by a white background." },
  { q: "Why can Windows, Photoshop or WhatsApp not open my AVIF?", a: "Many desktop programs and upload forms were built before AVIF became common and only support JPG, PNG, or WebP. Converting to JPG solves that." },
  { q: "Do my files get uploaded?", a: "No. Decoding and re-encoding happen locally in your browser." },
]

export default function AvifToJpgPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ToJpgClient accept={{ 'image/avif': ['.avif'] }} sourceLabel="AVIF" />
    </ToolLayout>
  )
}
