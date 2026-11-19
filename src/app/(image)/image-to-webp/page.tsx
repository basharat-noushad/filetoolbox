import Image from 'next/image'
import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ImageToWebpClient } from './ImageToWebpClient'

const tool = getToolBySlug('image-to-webp')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "JPG to WebP Converter Online Free — JPG & PNG",
    description: "Convert JPG to WebP online free, and PNG to WebP too. Smaller files for faster pages. Adjust quality and compare file sizes. No sign-up required.",
    keywords: tool.keywords,
    openGraph: {
      title: "JPG to WebP Converter Online Free — JPG & PNG | PDF and Image",
      description: "Convert JPG to WebP online free, and PNG to WebP too. Smaller files for faster pages. Adjust quality and compare file sizes. No sign-up required.",
    },
    twitter: {
      title: "JPG to WebP Converter Online Free — JPG & PNG | PDF and Image",
      description: "Convert JPG to WebP online free, and PNG to WebP too. Smaller files for faster pages. Adjust quality and compare file sizes. No sign-up required.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/image-to-webp')
}

const HOW_TO_STEPS = [
  'Upload your JPG or PNG image by clicking "Select File" or dragging and dropping.',
  'Adjust the quality slider to control WebP compression.',
  'Click "Convert to WebP" and download your smaller WebP file.',
]

const FAQS = [
  { q: 'What is WebP and why use it?', a: 'WebP is a modern image format by Google that produces files 25-35% smaller than JPG and PNG with the same visual quality. Ideal for websites.' },
  { q: 'Is WebP supported everywhere?', a: 'WebP is supported by all modern browsers (Chrome, Firefox, Safari, Edge). Older browsers may not support it.' },
  { q: 'How much smaller will my WebP file be?', a: 'Typically 25-40% smaller than equivalent JPG files, and 60-80% smaller than PNG files.' },
  { q: 'Does WebP support transparency?', a: 'Yes. WebP supports transparency (alpha channel) like PNG, while still being much smaller.' },
  { q: 'Can I batch convert multiple images to WebP?', a: 'Select one JPG or PNG at a time and download the resulting WebP.' },
]

export default function ImageToWebpPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ImageToWebpClient />
      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">JPG and WebP side by side</h2>
        <p>This 420 × 240 illustration takes 7,185 bytes as a JPG and 2,542 bytes as a WebP encoded at quality 85. Compare the diagonal edges and fine outlines. Photo results vary.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['landscape.jpg', 'Original JPG'],
            ['landscape.webp', 'WebP · 2,542 bytes'],
          ].map(([file, label]) => (
            <figure key={file}>
              <Image unoptimized src={'/examples/' + file} width={420} height={240} alt={label + ' of an illustrated mountain landscape'} className="h-auto w-full rounded-lg" />
              <figcaption><a className="text-brand-700 underline" href={'/examples/' + file} download>{label}</a></figcaption>
            </figure>
          ))}
        </div>
      </section>
    </ToolLayout>
  )
}
