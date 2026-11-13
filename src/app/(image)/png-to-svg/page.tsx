import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PngToSvgClient } from './PngToSvgClient'

const tool = getToolBySlug('png-to-svg')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "PNG to SVG Converter Free — Vectorize Images",
    description: "Convert PNG, JPG or WebP to a real SVG vector online for free. Traces your logo into scalable paths in your browser. No sign-up, no upload.",
    keywords: tool.keywords,
    openGraph: { title: 'PNG to SVG Converter Free | PDF and Image +', description: 'Trace PNG, JPG and WebP images into real scalable SVG vector paths, free and in your browser.' },
    twitter: { title: 'PNG to SVG Converter Free | PDF and Image +', description: 'Trace PNG, JPG and WebP images into real scalable SVG vector paths, free and in your browser.' },
    alternates: { canonical: `/${tool.slug}` },
  }, '/png-to-svg')
}

const HOW_TO_STEPS = [
  'Upload a PNG, JPG or WebP image. Logos, icons and flat artwork work best.',
  'Choose "Trace to vector" and a preset (Logo, Illustration, Detailed or Black & white), then click convert.',
  'Check the live preview and download your SVG file.',
]

const FAQS = [
  { q: 'Does this create a real vector?', a: 'Yes. In Trace mode the image is converted into colored vector paths that scale to any size without blur. Embed mode only wraps the original PNG inside an SVG and creates no paths.' },
  { q: 'Which images trace well?', a: 'Logos, icons, signatures, line art and flat illustrations with solid colors give clean results. Photos and gradients trace poorly: they become many small shapes, large files and a posterized look.' },
  { q: 'Which preset should I choose?', a: 'Use Logo / icon for simple artwork with few colors, Illustration for more colors, Detailed for finer shapes at the cost of file size, and Black & white for line art and silhouettes.' },
  { q: 'Are my files uploaded anywhere?', a: 'No. Tracing runs in your browser, so your image never leaves your device.' },
  { q: 'Why was my large image reduced in size?', a: 'Images are scaled down to 1200px on the longest side before tracing to keep it fast. The SVG keeps the original aspect ratio and size, and vectors scale up without losing sharpness.' },
  { q: 'Can I edit the SVG in Illustrator or Inkscape?', a: 'Yes. The traced SVG opens in any vector editor, where you can recolor, merge or delete individual paths.' },
]

export default function PngToSvgPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PngToSvgClient />
    </ToolLayout>
  )
}
