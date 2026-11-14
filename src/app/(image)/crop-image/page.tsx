import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { CropImageClient } from './CropImageClient'

const tool = getToolBySlug('crop-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Crop Image in cm, mm or px Online Free",
    description: "Crop image online free with an interactive cropper. Set the output size in cm, mm, inches or pixels, or pick a passport photo size. No sign-up.",
    keywords: tool.keywords,
    openGraph: {
      title: "Crop Image in cm, mm or px Online Free | PDF and Image +",
      description: "Crop image online free with an interactive cropper. Set the output size in cm, mm, inches or pixels, or pick a passport photo size. No sign-up.",
    },
    twitter: {
      title: "Crop Image in cm, mm or px Online Free | PDF and Image +",
      description: "Crop image online free with an interactive cropper. Set the output size in cm, mm, inches or pixels, or pick a passport photo size. No sign-up.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/crop-image')
}

const HOW_TO_STEPS = [
  'Upload your image by clicking "Select File" or dragging and dropping.',
  'Choose an aspect ratio, or enter an output size in px, cm, mm or in, or pick a passport size.',
  'Adjust the crop area and click "Crop Image" to download.',
]

const FAQS = [
  { q: 'What aspect ratios are available?', a: 'Free crop (any ratio), 1:1 (square), 16:9 (widescreen), 4:3 (standard), and 3:2 (photo) presets.' },
  { q: 'Can I set exact pixel dimensions for the crop?', a: 'Yes. Enter a width and height in px, cm, mm or in (with a DPI for physical units). The crop shape locks to that ratio and the result is exported at exactly that pixel size.' },
  { q: 'Can I crop a passport size photo?', a: 'Pick a preset such as 35x45 mm, 2x2 in or 50x70 mm. It sets the crop shape and exports at 300 DPI. Check the current official rules for head size and background; this tool does not guarantee acceptance.' },
  { q: 'Will the output be the same format as the input?', a: 'Yes. The cropped image preserves the original format (JPG, PNG, WebP).' },
  { q: 'Is there a size limit?', a: 'No. All processing is done in your browser locally with no file size limits.' },
  { q: 'What formats are supported for cropping?', a: 'JPG, PNG, WebP, and other common image formats are all supported. The output preserves the original format.' },
]

export default function CropImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <CropImageClient />
    </ToolLayout>
  )
}
