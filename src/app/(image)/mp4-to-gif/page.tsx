import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Mp4ToGifClient } from './Mp4ToGifClient'

const tool = getToolBySlug('mp4-to-gif')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'MP4 to GIF Converter Free Online',
    description: 'Convert MP4 video clips to animated GIF format online for free. Browser-based conversion via WebAssembly. No upload, no registration needed.',
    keywords: tool.keywords,
    openGraph: { title: 'MP4 to GIF Converter Free | PDF and Image +', description: 'Convert MP4 videos to animated GIF online for free. Browser-based, no upload needed.' },
    twitter: { title: 'MP4 to GIF Converter Free | PDF and Image +', description: 'Convert MP4 videos to animated GIF online for free. Browser-based, no upload needed.' },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your MP4 or MOV video file.',
  'Wait for FFmpeg to initialize (first use only).',
  'Click "Convert to GIF" and download your animated GIF.',
]

const FAQS = [
  { q: 'What video formats are supported?', a: 'MP4 and MOV (QuickTime) files are supported. The output is always an animated GIF.' },
  { q: 'How large can the input video be?', a: 'We recommend keeping videos under 50MB for best performance. Longer videos will produce larger GIF files.' },
  { q: 'Why is the output GIF resolution lower?', a: 'GIFs are scaled to 480px wide to keep the file size manageable. GIF format is inherently larger than video, so scaling helps balance quality and size.' },
  { q: 'Is my video file private?', a: 'Yes. All processing happens in your browser using WebAssembly. Your video never leaves your device.' },
]

export default function Mp4ToGifPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <Mp4ToGifClient />
    </ToolLayout>
  )
}
