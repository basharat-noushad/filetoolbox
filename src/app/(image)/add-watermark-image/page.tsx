import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { AddWatermarkImageClient } from './AddWatermarkImageClient'

const tool = getToolBySlug('add-watermark-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Add Watermark to Image Online Free',
    description: 'Add a text watermark to any image online for free. Control position, opacity, and size. Protect your photos and artwork. No registration needed.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Add Watermark to Image Online Free | PDF and Image +',
      description: 'Add a text watermark to any image online for free. Control position, opacity, and size. Protect your photos and artwork.',
    },
    twitter: {
      title: 'Add Watermark to Image Online Free | PDF and Image +',
      description: 'Add a text watermark to any image online for free. Control position, opacity, and size. Protect your photos and artwork.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your JPG, PNG, or WebP image using the file picker or drag and drop.',
  'Enter your watermark text, choose the position (center, corners) and set the opacity using the slider.',
  'Click "Add Watermark" to apply it. Your watermarked image will download automatically.',
]

const FAQS = [
  {
    q: 'Will the watermark affect the image quality?',
    a: 'No. The watermark is applied as an overlay using canvas rendering. The underlying image is preserved at its original quality.',
  },
  {
    q: 'Can I choose where the watermark appears?',
    a: 'Yes. You can place the watermark at the center, bottom-right, bottom-left, top-right, or top-left of the image.',
  },
  {
    q: 'What image formats are supported?',
    a: 'JPG, JPEG, PNG, and WebP images are all supported. The output is saved in the same format as the original.',
  },
  {
    q: 'Is my image uploaded to a server?',
    a: 'No. All processing happens entirely in your browser. Your image never leaves your device, keeping it completely private.',
  },
  {
    q: 'Can I control how transparent the watermark is?',
    a: 'Yes. Use the opacity slider to set transparency from 10% (nearly invisible) to 90% (nearly opaque). The default is 50%.',
  },
]

export default function AddWatermarkImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <AddWatermarkImageClient />
    </ToolLayout>
  )
}
