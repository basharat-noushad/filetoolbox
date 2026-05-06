import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { HeicToJpgClient } from './HeicToJpgClient'

const tool = getToolBySlug('heic-to-jpg')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'HEIC to JPG Converter Free Online',
    description: 'Convert HEIC/HEIF photos from iPhone to JPG format online for free. Works directly in your browser. No app download. Fast and private.',
    keywords: tool.keywords,
    openGraph: {
      title: 'HEIC to JPG Converter Free Online | PDF and Image +',
      description: 'Convert HEIC/HEIF photos from iPhone to JPG format online for free. Works in your browser — no app needed.',
    },
    twitter: {
      title: 'HEIC to JPG Converter Free Online | PDF and Image +',
      description: 'Convert HEIC/HEIF photos from iPhone to JPG format online for free. Works in your browser — no app needed.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Click "Select File" or drag and drop your HEIC or HEIF photo from your iPhone or Mac.',
  'The tool will automatically detect and convert your HEIC file to JPG format.',
  'Click "Download" to save the converted JPG image to your device.',
]

const FAQS = [
  {
    q: 'What is a HEIC file?',
    a: 'HEIC (High Efficiency Image Container) is the default photo format used by iPhones since iOS 11. It offers better compression than JPG but is not universally supported.',
  },
  {
    q: 'Why can\'t I open HEIC files on my Windows PC?',
    a: 'HEIC is an Apple format not natively supported by Windows or many older apps. Converting to JPG makes the photo universally compatible.',
  },
  {
    q: 'Will the photo quality be reduced?',
    a: 'The conversion uses high-quality settings (92% quality). Some minor data loss is expected as JPG is a lossy format, but photos will look excellent.',
  },
  {
    q: 'Does this work with HEIF files too?',
    a: 'Yes. HEIC and HEIF are closely related formats. This tool handles both .heic and .heif file extensions.',
  },
  {
    q: 'Are my iPhone photos kept private?',
    a: 'Absolutely. All conversion happens locally in your browser. Your photos are never uploaded to any server.',
  },
]

export default function HeicToJpgPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <HeicToJpgClient />
    </ToolLayout>
  )
}
