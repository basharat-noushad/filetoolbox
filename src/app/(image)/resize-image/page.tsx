import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ResizeImageClient } from './ResizeImageClient'

const tool = getToolBySlug('resize-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Resize Image in cm, mm, px Online Free",
    description: "Resize image in cm, mm, inches or pixels online free. Set DPI, lock the aspect ratio, use passport photo sizes. Runs in your browser, no sign-up.",
    keywords: tool.keywords,
    openGraph: {
      title: "Resize Image in cm, mm, px Online Free | PDF and Image +",
      description: "Resize image in cm, mm, inches or pixels online free. Set DPI, lock the aspect ratio, use passport photo sizes. Runs in your browser, no sign-up.",
    },
    twitter: {
      title: "Resize Image in cm, mm, px Online Free | PDF and Image +",
      description: "Resize image in cm, mm, inches or pixels online free. Set DPI, lock the aspect ratio, use passport photo sizes. Runs in your browser, no sign-up.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/resize-image')
}

const HOW_TO_STEPS = [
  'Upload your image by clicking "Select File" or dragging and dropping.',
  'Pick a unit (px, cm, mm or in), set the DPI, and enter width and height, or choose a preset or passport size.',
  'Click "Resize Image" and download your resized file.',
]

const FAQS = [
  { q: 'How do I resize an image in cm?', a: 'Choose cm as the unit, set a DPI (300 is standard for print) and enter the size. The tool converts it to pixels as inches times DPI and shows the exact result, for example 35 x 45 mm at 300 DPI is 413 x 531 px.' },
  { q: 'Is the DPI saved in the file?', a: 'Yes for JPG and PNG, so print size is read correctly by editors and print shops. WebP files do not store DPI.' },
  { q: 'Can I make a passport size photo?', a: 'The ID presets (US 2x2 in, 35x45 mm, 50x70 mm, 33x48 mm) set the exact size at 300 DPI and centre-crop your photo to fit. Check the current official rules for head size and background; this tool does not guarantee acceptance.' },
  { q: 'What formats can I resize?', a: 'JPG, PNG, WebP, and most common image formats are supported.' },
  { q: 'Will aspect ratio be maintained?', a: 'Yes, by default. You can disable aspect ratio lock to set width and height independently.' },
  { q: 'What are the preset sizes?', a: 'Presets include 1920×1080 (HD), 1280×720 (720p), 800×600, and 512×512 (square).' },
  { q: 'Will resizing reduce quality?', a: 'Enlarging beyond the original size may reduce sharpness. Reducing size is lossless in terms of quality.' },
  { q: 'What happens if I only set width without height?', a: 'With aspect ratio lock enabled (default), the height is calculated automatically to maintain the original proportions. Disable the lock to set both dimensions independently.' },
  { q: 'Will resizing reduce the file size?', a: 'Yes. Reducing pixel dimensions also reduces file size significantly. A 4000×3000 image resized to 1920×1440 will be roughly 4-6× smaller.' },
]

export default function ResizeImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ResizeImageClient />
    </ToolLayout>
  )
}
