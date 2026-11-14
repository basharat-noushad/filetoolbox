import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { QrCodeScannerClient } from './QrCodeScannerClient'

const tool = getToolBySlug('qr-code-scanner')!

export async function generateMetadata(): Promise<Metadata> {
  const title = 'QR Code Scanner: Scan QR Code from Image'
  const description = 'QR code scanner online: scan a QR code from an image or with your camera. Reads links, Wi-Fi and contacts in your browser. Nothing is uploaded.'
  return withSocialMetadata({
    title,
    description,
    keywords: tool.keywords,
    openGraph: { title: `${title} | PDF and Image +`, description },
    twitter: { title: `${title} | PDF and Image +`, description },
    alternates: { canonical: `/${tool.slug}` },
  }, '/qr-code-scanner')
}

const HOW_TO_STEPS = [
  'Drop, paste (Ctrl+V) or choose an image that contains a QR code, or press "Use camera" to scan a printed one.',
  'The code is decoded in your browser. Rotated, small, low-contrast and inverted codes are retried automatically.',
  'Read the content, copy it, and check any link carefully before you open it. Links are never opened for you.',
]

const FAQS = [
  { q: 'How do I scan a QR code from an image?', a: 'Upload a screenshot or photo, drag it onto the page or paste it from the clipboard. The tool finds the code and shows its content as text, with Wi-Fi and contact codes split into readable fields.' },
  { q: 'Is it safe to scan QR codes here?', a: 'The image is decoded locally and never uploaded. The tool never opens links automatically. Check the address before you visit it, because QR codes are sometimes used to hide phishing links.' },
  { q: 'Why can it not find my QR code?', a: 'Crop closer to the code, avoid glare and blur, and make sure the whole code with its white border is in the picture. Heavily damaged codes or very small ones in a large photo can still fail.' },
  { q: 'Can I use my camera?', a: 'Yes. Press "Use camera" and allow access when your browser asks. The video stays on your device and the camera stops as soon as a code is read or you press Stop.' },
  { q: 'What kinds of QR codes does it read?', a: 'Any standard QR code. Links, Wi-Fi, contacts (vCard and MeCard), email, phone, SMS, locations, calendar events and UPI or Bitcoin payments are recognised and laid out clearly; anything else is shown as plain text.' },
]

export default function QrCodeScannerPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <QrCodeScannerClient />
    </ToolLayout>
  )
}
