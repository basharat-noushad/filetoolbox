import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ToJpgClient } from '../png-to-jpg/ToJpgClient'

const tool = getToolBySlug('bmp-to-jpg')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "BMP to JPG Converter Online Free",
    description: "Convert BMP to JPG online free. Shrink huge bitmap files to small JPGs with an adjustable quality slider. Batch convert and keep files private.",
    keywords: tool.keywords,
    openGraph: {
      title: "BMP to JPG Converter Online Free | PDF and Image +",
      description: "Convert BMP to JPG online free. Shrink huge bitmap files to small JPGs with an adjustable quality slider. Batch convert and keep files private.",
    },
    twitter: {
      title: "BMP to JPG Converter Online Free | PDF and Image +",
      description: "Convert BMP to JPG online free. Shrink huge bitmap files to small JPGs with an adjustable quality slider. Batch convert and keep files private.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/bmp-to-jpg')
}

const HOW_TO_STEPS = [
  "Add your .bmp files with \"Select Files\" or by dropping them into the upload area.",
  "Move the quality slider. Around 90% keeps scans and screenshots sharp.",
  "Click \"Convert to JPG\" and download the JPG, or a ZIP for several files.",
]

const FAQS = [
  { q: "Why are BMP files so large?", a: "A BMP stores the colour of every pixel with little or no compression, so a photo can take 10 to 30 times the space of a JPG. That is why converting often shrinks the file dramatically." },
  { q: "How much smaller will my JPG be?", a: "For photos, usually 90% smaller or more at 85% quality. Images with flat colours and sharp text compress less well and may show slight artefacts around edges." },
  { q: "Is BMP to JPG conversion lossless?", a: "No. JPG is lossy. Use a high quality setting such as 90 to 95 for screenshots, line art, or scans where edges matter." },
  { q: "Can I convert old Windows Paint bitmaps?", a: "Yes, standard 8, 16, 24, and 32-bit BMP files that your browser can decode work. Rare variants such as RLE-compressed BMPs may fail with an error." },
  { q: "What about transparency in 32-bit BMPs?", a: "JPG has no transparency, so transparent areas are filled with white." },
  { q: "Is it safe to convert private files here?", a: "Yes. The bitmap is decoded and re-encoded in your browser and is never uploaded." },
]

export default function BmpToJpgPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ToJpgClient accept={{ 'image/bmp': ['.bmp'] }} sourceLabel="BMP" />
    </ToolLayout>
  )
}
