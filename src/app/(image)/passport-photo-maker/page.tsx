import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { PassportPhotoMakerClient } from './PassportPhotoMakerClient'

const tool = getToolBySlug('passport-photo-maker')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Passport Photo Maker Online Free, Any Size",
    description: "Passport photo maker online free: pick your country size, set a white or blue background, and print on a 4×6 sheet. Runs in your browser.",
    keywords: tool.keywords,
    openGraph: {
      title: 'Passport Photo Maker Online Free, Any Size | PDF and Image +',
      description: 'Make passport and visa photos at the right size, change the background and print several on one sheet. Files never leave your device.',
    },
    twitter: {
      title: 'Passport Photo Maker Online Free, Any Size | PDF and Image +',
      description: 'Make passport and visa photos at the right size, change the background and print several on one sheet.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/passport-photo-maker')
}

const HOW_TO_STEPS = [
  'Upload a front-facing portrait (JPG, PNG, or WebP) and choose your country or document size.',
  'Check the automatic face position, adjust it with the zoom slider and by dragging, and pick a background colour.',
  'Download the single photo at 300 DPI (optionally under a file size limit), or a 4×6 in or A4 print sheet as JPG or PDF.',
]

const FAQS = [
  { q: 'What sizes does the passport photo maker support?', a: 'US 2×2 in, 35×45 mm (UK, EU, India, Pakistan and Schengen visas), Canada 50×70 mm and China 33×48 mm. Photos are exported at 300 DPI, for example 413×531 pixels for 35×45 mm.' },
  { q: 'Can I make a passport photo with a white or blue background?', a: 'Yes. Choose white, off-white, light blue, light grey or any custom colour. The background is replaced in your browser with a person-detection model, with a softened edge. Check hair edges at full size, and use a plain, evenly lit wall for the best result.' },
  { q: 'How do I get a passport photo under 240 KB or 100 KB?', a: 'Set a maximum file size before creating the photo. The tool lowers JPG quality until it fits. If that is not enough it has to shrink the pixel size, and it tells you when that happens.' },
  { q: 'How do I print passport photos on 4×6 paper?', a: 'Create a 4×6 in sheet. It places as many copies as fit at 300 DPI with thin cut guides. Download the JPG or PDF and print at 100% scale (no "fit to page") at a photo lab or on a home printer.' },
  { q: 'Will my photo be accepted?', a: 'We cannot guarantee that. Head size, background and expression rules differ by country and change over time. The automatic position is approximate guidance, so always check the official requirements of the issuing authority.' },
  { q: 'Is my photo uploaded anywhere?', a: 'No. Face detection and background replacement run on your device using small models served from this site. Your photo never leaves your browser.' },
]

export default function PassportPhotoMakerPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <PassportPhotoMakerClient />
    </ToolLayout>
  )
}
