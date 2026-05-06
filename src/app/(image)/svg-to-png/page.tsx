import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { SvgToPngClient } from './SvgToPngClient'

const tool = getToolBySlug('svg-to-png')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'SVG to PNG Converter Free Online | PDF and Image +',
    description: 'Convert SVG vector files to PNG images online for free. Set custom width and height for the output. Perfect for web and print use.',
    keywords: tool.keywords,
    openGraph: {
      title: 'SVG to PNG Converter Free Online | PDF and Image +',
      description: 'Convert SVG vector files to PNG images online for free. Set custom dimensions for the output.',
    },
    twitter: {
      title: 'SVG to PNG Converter Free Online | PDF and Image +',
      description: 'Convert SVG vector files to PNG images online for free. Set custom dimensions for the output.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your SVG file by clicking "Select File" or dragging and dropping it into the upload area.',
  'Optionally enter a custom width and/or height in pixels for the output PNG. Leave blank to use the SVG\'s original dimensions.',
  'Click "Convert to PNG" to generate your image and download it instantly.',
]

const FAQS = [
  {
    q: 'Why would I convert SVG to PNG?',
    a: 'SVG files are vectors and not supported everywhere. PNG is a widely compatible raster format supported by virtually all apps, browsers, and platforms.',
  },
  {
    q: 'Can I set a custom resolution for the PNG?',
    a: 'Yes. Enter a custom width or height (in pixels) in the optional fields. If you set only one dimension, the other will be derived from the SVG\'s aspect ratio.',
  },
  {
    q: 'Will the transparent background be preserved?',
    a: 'The output PNG uses a white background by default for maximum compatibility. SVG transparency is not preserved in the current conversion.',
  },
  {
    q: 'What if my SVG contains fonts or complex effects?',
    a: 'Simple SVGs convert perfectly. Complex SVGs with embedded fonts or advanced filters may render differently depending on browser support.',
  },
]

export default function SvgToPngPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <SvgToPngClient />
    </ToolLayout>
  )
}
