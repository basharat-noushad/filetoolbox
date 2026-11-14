import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { JpgToPngClient } from './JpgToPngClient'

const tool = getToolBySlug('jpg-to-png')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "JPG to PNG Converter — Transparent Background",
    description: "Convert JPG to PNG online free and optionally make the background transparent. Batch ZIP, full resolution, runs in your browser. No sign-up.",
    keywords: tool.keywords,
    openGraph: {
      title: "JPG to PNG Converter — Transparent Background | PDF and Image +",
      description: "Convert JPG to PNG online free and optionally make the background transparent. Batch ZIP, full resolution, runs in your browser. No sign-up.",
    },
    twitter: {
      title: "JPG to PNG Converter — Transparent Background | PDF and Image +",
      description: "Convert JPG to PNG online free and optionally make the background transparent. Batch ZIP, full resolution, runs in your browser. No sign-up.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/jpg-to-png')
}

const HOW_TO_STEPS = [
  'Upload one or more JPG images by clicking "Select Files" or dragging and dropping.',
  'Optional: tick "Make background transparent", adjust the tolerance, or click the preview to pick the background colour.',
  'Click "Convert to PNG" and download your PNG or ZIP.',
]

const FAQS = [
  { q: 'How do I convert JPG to PNG with a transparent background?', a: 'Tick "Make background transparent". The tool detects the background colour from the image border, removes it, and shows a live preview on a checkerboard. You can click the preview to pick a different colour and adjust the tolerance.' },
  { q: 'When does the transparent background work well?', a: 'Best for logos, signatures, icons, scans and products photographed on a plain white or solid-colour background. It removes one colour range, so gradients, shadows and busy backgrounds will not come out clean.' },
  { q: 'Should I use Remove Background instead?', a: 'For photos of people, pets or objects on a complex background, use our Remove Background tool, which is designed for that. This option only removes a solid background colour.' },
  { q: 'Why is the inside of a letter like "O" still white?', a: 'By default only background connected to the image edges is removed, so enclosed areas stay. Tick "Remove all matching colour" to clear those too, but this also removes the same colour anywhere inside your artwork.' },
  { q: 'Can I convert multiple JPGs at once?', a: 'Yes. Select up to 20 files and they download as a ZIP. The same settings apply to every file, and the background colour is auto-detected per file unless you picked one.' },
  { q: 'Is the output lossless and full size?', a: 'The PNG has the same pixel dimensions as your JPG, and the conversion itself adds no loss. JPG compression artifacts already in the picture remain, so PNG files are usually larger.' },
]

export default function JpgToPngPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <JpgToPngClient />
    </ToolLayout>
  )
}
