import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PngToSvgClient } from './PngToSvgClient'

const tool = getToolBySlug('png-to-svg')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'PNG to SVG Converter Free Online | PDF and Image +',
    description: 'Convert PNG images to SVG format online for free. Embed raster images in scalable SVG containers for web use. Fast and easy conversion.',
    keywords: tool.keywords,
    openGraph: { title: 'PNG to SVG Converter Free | PDF and Image +', description: 'Convert PNG to SVG online for free. Create scalable SVG files for web use.' },
    twitter: { title: 'PNG to SVG Converter Free | PDF and Image +', description: 'Convert PNG to SVG online for free. Create scalable SVG files for web use.' },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PNG image file.',
  'Click "Convert to SVG" to wrap your image in an SVG container.',
  'Download the SVG file — it can now be scaled without quality loss.',
]

const FAQS = [
  { q: 'Is this true vector conversion?', a: 'This tool creates an SVG with your PNG embedded as a raster image. It allows SVG scaling and embedding but does not trace actual vector paths. True vector tracing requires server-side Potrace processing.' },
  { q: 'When is this useful?', a: 'When you need to embed a raster image in SVG-based workflows, web pages, or vector editors — without needing true vector paths.' },
  { q: 'Can I open the SVG in Illustrator or Inkscape?', a: 'Yes. The SVG file opens in any vector editor. The embedded image will be visible and you can add vector elements around it.' },
  { q: 'Will the SVG file be large?', a: 'The SVG file size will be similar to the original PNG since it contains the same image data embedded in an SVG wrapper.' },
]

export default function PngToSvgPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PngToSvgClient />
    </ToolLayout>
  )
}
