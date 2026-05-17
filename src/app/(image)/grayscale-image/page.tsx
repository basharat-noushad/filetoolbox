import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { GrayscaleImageClient } from './GrayscaleImageClient'

const tool = getToolBySlug('grayscale-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Grayscale Image Online Free — Convert Photo to Black & White',
    description: 'Convert color images to grayscale (black and white) online for free. Instant conversion, no quality loss. Supports JPG, PNG, WebP formats.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Grayscale Image Online Free — Black & White Photo Converter | PDF and Image +',
      description: 'Convert color images to black and white online for free. Instant, no quality loss.',
    },
    twitter: {
      title: 'Grayscale Image Online Free — Black & White Photo Converter | PDF and Image +',
      description: 'Convert color images to black and white online for free. Instant, no quality loss.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your color JPG, PNG, or WebP image using the file picker or by dragging it into the upload area.',
  'Click "Convert to Grayscale" to instantly desaturate all colors from the image.',
  'Download your black and white image. The output keeps the same format and dimensions as the original.',
]

const FAQS = [
  {
    q: 'What is the difference between grayscale and black and white?',
    a: 'Grayscale images contain a full range of grey tones from pure black to pure white, preserving detail and shading. True black-and-white (1-bit) images contain only two values.',
  },
  {
    q: 'Will the image dimensions change?',
    a: 'No. The output image has exactly the same width and height as the original. Only the colors are removed.',
  },
  {
    q: 'Which formats are supported?',
    a: 'JPG, PNG, and WebP images are supported. PNG images are saved as grayscale PNG to preserve transparency; JPG and WebP are saved as JPG.',
  },
  {
    q: 'Is there a file size limit?',
    a: 'Files up to 50MB are supported. All processing happens in your browser — no upload required.',
  },
  {
    q: 'Can I convert multiple images at once?',
    a: 'Currently, one image is processed at a time. Upload each image separately and download the grayscale version before processing the next.',
  },
]

export default function GrayscaleImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <GrayscaleImageClient />
    </ToolLayout>
  )
}
