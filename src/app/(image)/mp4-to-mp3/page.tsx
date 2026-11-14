import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { Mp4ToMp3Client } from './Mp4ToMp3Client'

const tool = getToolBySlug('mp4-to-mp3')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: 'MP4 to MP3 Converter Online Free',
    description: 'MP4 to MP3 converter online free: extract the audio from an MP4, MOV, WebM or MKV video at 128, 192 or 320 kbps. Private, runs in your browser.',
    keywords: tool.keywords,
    openGraph: { title: 'MP4 to MP3 Converter Online Free | PDF and Image +', description: 'Extract MP3 audio from MP4 video online for free. Browser-based, no upload, no sign-up.' },
    twitter: { title: 'MP4 to MP3 Converter Online Free | PDF and Image +', description: 'Extract MP3 audio from MP4 video online for free. Browser-based, no upload, no sign-up.' },
    alternates: { canonical: `/${tool.slug}` },
  }, '/mp4-to-mp3')
}

const HOW_TO_STEPS = [
  'Upload your MP4, MOV, WebM or MKV video file.',
  'Choose an MP3 quality: 128, 192 or 320 kbps.',
  'Click "Convert to MP3" and download the audio file.',
]

const FAQS = [
  { q: 'Which video formats can I convert to MP3?', a: 'MP4, MOV, WebM and MKV files. The audio track is extracted and encoded as MP3.' },
  { q: 'Which bitrate should I choose?', a: '128 kbps is fine for speech, 192 kbps suits most music, and 320 kbps is the highest MP3 quality and the largest file.' },
  { q: 'How large can the video be?', a: 'We recommend files under 50MB. Conversion runs on your own device, so very large videos can be slow or run out of memory.' },
  { q: 'Why does it say my video has no audio?', a: 'The file contains no audio track (for example a screen recording made without sound), so there is nothing to extract.' },
  { q: 'Is my video uploaded to a server?', a: 'No. The conversion happens in your browser with WebAssembly, so your video never leaves your device.' },
]

export default function Mp4ToMp3Page() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <Mp4ToMp3Client />
    </ToolLayout>
  )
}
