import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { CompressImageClient } from './CompressImageClient'

const tool = getToolBySlug('compress-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Compress Image to 100KB Online Free",
    description: "Compress image to 100 KB, 50 KB or any size online free. Shrink JPG, PNG and WebP by quality or target size. No sign-up, runs in your browser.",
    keywords: tool.keywords,
    openGraph: {
      title: "Compress Image to 100KB Online Free | PDF and Image +",
      description: "Compress image to 100 KB, 50 KB or any size online free. Shrink JPG, PNG and WebP by quality or target size. No sign-up, runs in your browser.",
    },
    twitter: {
      title: "Compress Image to 100KB Online Free | PDF and Image +",
      description: "Compress image to 100 KB, 50 KB or any size online free. Shrink JPG, PNG and WebP by quality or target size. No sign-up, runs in your browser.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/compress-image')
}

const HOW_TO_STEPS = [
  'Upload your JPG, PNG or WebP image by clicking "Select File" or dragging and dropping.',
  'Choose "By quality" and set the slider, or choose "To target size" and enter a size like 100 KB.',
  'Click compress and download your smaller image.',
]

const FAQS = [
  { q: 'How do I compress an image to 100 KB?', a: 'Choose "To target size", pick the 100 KB preset (or type any number of KB) and click compress. The tool finds the highest quality that stays under your limit and shrinks the dimensions only if it has to.' },
  { q: 'Can I compress a JPEG to 50 KB or 200 KB?', a: 'Yes. Use the presets for 20, 50, 100, 200 or 500 KB and 1 MB, or enter your own size. Very small targets on large photos may need a reduction in pixel dimensions too.' },
  { q: 'Why does my PNG turn into a JPG or WebP?', a: 'PNG is lossless, so its size cannot be tuned with a quality setting. To hit a target size we convert it to JPG (white background) or WebP (keeps transparency), whichever you pick.' },
  { q: 'What if the target size cannot be reached?', a: 'We show the smallest file we could produce and its size so you can decide. Try a slightly larger target or a smaller original image.' },
  { q: 'Will compression affect image dimensions?', a: 'In quality mode, no. In target size mode, dimensions are reduced only when lowering quality alone is not enough, and the new size is shown.' },
  { q: 'Is there a file size limit?', a: 'No upload limit. All compression runs locally in your browser, so your images are never uploaded.' },
]

export default function CompressImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <CompressImageClient />
    </ToolLayout>
  )
}
