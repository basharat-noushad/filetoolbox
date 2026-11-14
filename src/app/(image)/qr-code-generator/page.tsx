import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { QrCodeGeneratorClient } from './QrCodeGeneratorClient'

const tool = getToolBySlug('qr-code-generator')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: 'QR Code Generator Free, No Expiration',
    description: 'QR code generator free online: make QR codes for links, Wi-Fi, text and contacts, add a logo, and download PNG or SVG. Static codes that never expire.',
    keywords: tool.keywords,
    openGraph: { title: 'QR Code Generator Free, No Expiration | PDF and Image +', description: 'Create static QR codes for URLs, Wi-Fi, email and more. PNG and SVG download, optional logo, no sign-up.' },
    twitter: { title: 'QR Code Generator Free, No Expiration | PDF and Image +', description: 'Create static QR codes for URLs, Wi-Fi, email and more. PNG and SVG download, optional logo, no sign-up.' },
    alternates: { canonical: `/${tool.slug}` },
  }, '/qr-code-generator')
}

const HOW_TO_STEPS = [
  'Choose what the code should hold (link, text, Wi-Fi, email, phone, SMS or contact) and fill in the details.',
  'Pick size, colours and error correction, and optionally add a centre logo. The preview updates as you type.',
  'Download the QR code as a PNG or SVG file and test-scan it before you print it.',
]

const FAQS = [
  { q: 'Is this QR code generator free for life?', a: 'Yes. Everything is free and there is no account. The codes are generated in your browser and the tool has no paid tier.' },
  { q: 'Do these QR codes expire?', a: 'No. The code is static: your link or text is encoded directly in the image, with no redirect through our servers, no tracking and no subscription behind it. It works for as long as the destination does.' },
  { q: 'Can I add a logo to my QR code?', a: 'Yes. Upload a logo and it is placed in the centre at about 20% of the code width. Error correction is switched to the highest level (H) so the code stays scannable. Always test-scan the result.' },
  { q: 'Which format should I download, PNG or SVG?', a: 'Use SVG for print and anything that must scale without blurring. Use PNG for web pages, slides and documents.' },
  { q: 'Why is my QR code not scanning?', a: 'Usually the colours: keep the dark colour clearly darker than the background and avoid inverted codes. Also keep the quiet margin, and shorten long text since dense codes are harder to scan.' },
]

export default function QrCodeGeneratorPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <QrCodeGeneratorClient />
    </ToolLayout>
  )
}
