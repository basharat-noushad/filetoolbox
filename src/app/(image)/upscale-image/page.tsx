import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { UpscaleImageClient } from './UpscaleImageClient'

const tool = getToolBySlug('upscale-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "AI Image Upscaler Online Free — 2× and 4×",
    description: "Upscale images online free with AI (Real-ESRGAN) at 2× or 4×. Runs privately on your device, nothing is uploaded. Saves PNG or JPG.",
    keywords: tool.keywords,
    openGraph: { title: 'AI Image Upscaler Online Free — 2× and 4× | PDF and Image +', description: 'Upscale images 2× or 4× with an AI model that runs in your browser. Free, private, no upload.' },
    twitter: { title: 'AI Image Upscaler Online Free — 2× and 4× | PDF and Image +', description: 'Upscale images 2× or 4× with an AI model that runs in your browser. Free, private, no upload.' },
    alternates: { canonical: `/${tool.slug}` },
  }, '/upscale-image')
}

const HOW_TO_STEPS = [
  'Upload a JPG, PNG or WebP image and choose AI upscale with 2× or 4×.',
  'Click "Upscale Image" and wait for the tiles to finish. You can cancel at any time.',
  'Drag the comparison slider to check the result, then download it as PNG or JPG.',
]

const FAQS = [
  { q: 'How does the AI upscaler work?', a: 'It runs the Real-ESRGAN neural network (realesr-general-x4v3) inside your browser. The image is processed in small overlapping tiles, using your graphics card (WebGPU) when available and the CPU otherwise.' },
  { q: 'Is my image uploaded anywhere?', a: 'No. The image is processed entirely on your device. The first use downloads the roughly 5 MB model from this site, then it is cached by your browser.' },
  { q: 'Does AI really add detail?', a: 'It invents plausible detail based on what it learned from many photos. That usually looks sharper, but it is not the real original detail. Faces and small text can look slightly off, so check the result before relying on it.' },
  { q: 'Why is it slow, or limited in size?', a: 'AI upscaling is heavy. 4× works on images up to 1500 px on the long edge and 2× up to 3000 px, and you can resize to fit with one click. Without WebGPU (many phones and older browsers) it runs on the CPU and can take minutes.' },
  { q: 'What is "Enlarge without AI"?', a: 'A fast option that only enlarges pixels with standard browser interpolation (2×, 3× or 4×). It is instant and works on any size, but it adds no detail.' },
]

export default function UpscaleImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <UpscaleImageClient />
    </ToolLayout>
  )
}
