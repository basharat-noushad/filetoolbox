import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { GifToMp4Client } from './GifToMp4Client'

const tool = getToolBySlug('gif-to-mp4')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'GIF to MP4 Converter Free Online',
    description: 'Convert animated GIF files to MP4 video online for free. Smaller file size, better compatibility. Processed in your browser via WebAssembly.',
    keywords: tool.keywords,
    openGraph: { title: 'GIF to MP4 Converter Free | PDF and Image +', description: 'Convert animated GIFs to MP4 video online for free. Browser-based WebAssembly processing.' },
    twitter: { title: 'GIF to MP4 Converter Free | PDF and Image +', description: 'Convert animated GIFs to MP4 video online for free. Browser-based WebAssembly processing.' },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your animated GIF file.',
  'Wait for FFmpeg to load (first use only — about 30MB download).',
  'Click "Convert to MP4" and download your video file.',
]

const FAQS = [
  { q: 'Why use MP4 instead of GIF?', a: 'MP4 videos are typically 80-95% smaller than equivalent GIFs and have much better browser and device support. Social media platforms also prefer MP4.' },
  { q: 'Why does the first conversion take longer?', a: 'The first conversion loads FFmpeg WebAssembly (~30MB) into your browser. Subsequent conversions in the same session are instant.' },
  { q: 'Is my GIF uploaded to a server?', a: 'No. All conversion happens entirely in your browser using WebAssembly. Your file never leaves your device.' },
  { q: 'Will the animation be preserved?', a: 'Yes. All frames of the GIF are preserved in the MP4 output with the same timing and playback speed.' },
]

export default function GifToMp4Page() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <GifToMp4Client />
    </ToolLayout>
  )
}
