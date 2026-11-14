import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { QrCodeGeneratorClient } from './QrCodeGeneratorClient'

const tool = getToolBySlug('qr-code-generator')!

export async function generateMetadata(): Promise<Metadata> {
  const title = 'QR Code Generator Free, No Expiration'
  const description = 'QR code generator free online with logo, colours, frames and bulk export. 17 types incl. Wi-Fi, WhatsApp and UPI. Static codes that never expire.'
  return withSocialMetadata({
    title,
    description,
    keywords: tool.keywords,
    openGraph: { title: `${title} | PDF and Image +`, description },
    twitter: { title: `${title} | PDF and Image +`, description },
    alternates: { canonical: `/${tool.slug}` },
  }, '/qr-code-generator')
}

const HOW_TO_STEPS = [
  'Pick what the code should hold (link, Wi-Fi, WhatsApp, location, calendar event, payment and more) and fill in the short form.',
  'Style it: dot and corner shapes, colours or a gradient, a centre logo and an optional "Scan me" frame. The preview updates live and checks that it still scans.',
  'Download PNG, JPG, SVG or a print-size PDF, copy the image, or switch to Bulk to make up to 500 codes as a ZIP.',
]

const FAQS = [
  { q: 'Is this QR code generator free for life?', a: 'Yes. There is no account, no paid tier and no watermark. Codes are generated in your browser, so your content is never uploaded.' },
  { q: 'Do these QR codes expire?', a: 'No. These are static codes: your link or text is encoded directly in the image, with no redirect through our servers, no tracking and no subscription behind it. They work for as long as the destination does. The trade-off is that a static code cannot be edited after printing, and we do not offer scan statistics.' },
  { q: 'How does the scan check work?', a: 'After every change the preview is decoded again in your browser and compared with what you typed. You see "Scans OK" or a warning if contrast, a gradient, a big logo or the content length makes it risky. It is a strong check but not a replacement for a real test scan with your phone before printing.' },
  { q: 'Which format should I download?', a: 'SVG for print and anything that must scale sharply. PNG for web and slides, JPG when a flat white background is fine, and PDF when you need an exact print size in cm or inches. The PDF is a 300 DPI image, not vector artwork.' },
  { q: 'Can I add a logo or a Scan me frame?', a: 'Yes. Upload a logo, choose its size and hide the dots behind it; error correction switches to High (30%) automatically. Frames add a label bar or outline with your own text and colour and are included in every download.' },
  { q: 'How do I make many QR codes at once?', a: 'Use Bulk mode: paste one value per line or upload a CSV with a url, text or value column and an optional name column. Up to 500 codes are made with your current design and downloaded as one ZIP of PNG files.' },
]

export default function QrCodeGeneratorPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <QrCodeGeneratorClient />
    </ToolLayout>
  )
}
