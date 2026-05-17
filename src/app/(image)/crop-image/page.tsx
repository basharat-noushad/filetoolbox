import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { CropImageClient } from './CropImageClient'

const tool = getToolBySlug('crop-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Crop Image Online Free — Interactive Image Cropper',
    description: 'Crop images with an interactive cropper online for free. Use preset aspect ratios or set custom dimensions. No registration.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Crop Image Online Free — Interactive Image Cropper | PDF and Image +',
      description: 'Crop images with an interactive cropper online for free. Use preset aspect ratios or set custom dimensions. No registration.',
    },
    twitter: {
      title: 'Crop Image Online Free — Interactive Image Cropper | PDF and Image +',
      description: 'Crop images with an interactive cropper online for free. Use preset aspect ratios or set custom dimensions. No registration.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your image by clicking "Select File" or dragging and dropping.',
  'Select an aspect ratio preset (Free, 1:1, 16:9, 4:3, 3:2) or use free crop.',
  'Adjust the crop area and click "Crop Image" to download.',
]

const FAQS = [
  { q: 'What aspect ratios are available?', a: 'Free crop (any ratio), 1:1 (square), 16:9 (widescreen), 4:3 (standard), and 3:2 (photo) presets.' },
  { q: 'Can I set exact pixel dimensions for the crop?', a: 'Use the Free mode and resize the crop handle to your desired dimensions.' },
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
