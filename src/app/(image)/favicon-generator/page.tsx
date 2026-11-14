import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { FaviconGeneratorClient } from './FaviconGeneratorClient'

const tool = getToolBySlug('favicon-generator')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: 'Favicon Generator from Image, PNG or SVG',
    description: 'Favicon generator online free: turn a PNG, JPG, WebP or SVG logo into favicon.ico plus Apple touch and Android icons. Runs in your browser.',
    keywords: tool.keywords,
    openGraph: { title: 'Favicon Generator from Image | PDF and Image +', description: 'Create favicon.ico, apple-touch-icon and PWA icons from your logo. Free, private, no upload.' },
    twitter: { title: 'Favicon Generator from Image | PDF and Image +', description: 'Create favicon.ico, apple-touch-icon and PWA icons from your logo. Free, private, no upload.' },
    alternates: { canonical: `/${tool.slug}` },
  }, '/favicon-generator')
}

const HOW_TO_STEPS = [
  'Upload a square logo as PNG, JPG, WebP or SVG (512 px or larger works best).',
  'Choose whether to remove a plain background, then adjust padding, corners and background fill while checking the light and dark previews.',
  'Download the full icon pack as a ZIP, or just favicon.ico, then paste the HTML snippet into your page head.',
]

const FAQS = [
  { q: 'What does the favicon pack contain?', a: 'favicon.ico with 16, 32 and 48 px images, apple-touch-icon.png (180 px), icon-192.png, icon-512.png, a site.webmanifest file and an HTML snippet with the matching link tags.' },
  { q: 'Can I use this as an ICO converter?', a: 'Yes. Upload a PNG, JPG, WebP or SVG and download "ICO only" to get a multi-size .ico file.' },
  { q: 'Which image should I upload?', a: 'A square image at least 512 x 512 px, or an SVG. Simple shapes with few details stay readable at 16 px.' },
  { q: 'What happens to a non-square image?', a: 'You choose: pad it with empty space so nothing is cut off, or crop it to a centred square.' },
  { q: 'Can I remove the background from my logo?', a: 'Yes. After uploading you are asked whether to remove the background. "Remove plain background" works best on logos on white or a solid colour; for photos with a complex background, use the Remove Background tool first. Images that already have transparency are kept as they are.' },
  { q: 'Why does the apple-touch-icon have a solid background?', a: 'iOS shows transparent apple-touch-icons on a black square. So that icon always gets a solid fill (white by default, or the colour you choose), while the other PNG icons and favicon.ico can stay transparent.' },
  { q: 'Is my logo uploaded anywhere?', a: 'No. The icons are created in your browser and your image never leaves your device.' },
]

export default function FaviconGeneratorPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <FaviconGeneratorClient />
    </ToolLayout>
  )
}
