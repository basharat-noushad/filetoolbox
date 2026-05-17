import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { HeicToJpgClient } from './HeicToJpgClient'

const tool = getToolBySlug('heic-to-jpg')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'HEIC to JPG Online Free — Convert iPhone Photos to JPG',
    description: 'Convert HEIC/HEIF photos from iPhone to JPG format online for free. Works in your browser — no app download, no registration, 100% private.',
    keywords: tool.keywords,
    openGraph: {
      title: 'HEIC to JPG Online Free — Convert iPhone Photos to JPG | PDF and Image +',
      description: 'Convert HEIC/HEIF photos from iPhone to JPG format online for free. Works in your browser — no app download, no registration.',
    },
    twitter: {
      title: 'HEIC to JPG Online Free — Convert iPhone Photos to JPG | PDF and Image +',
      description: 'Convert HEIC/HEIF photos from iPhone to JPG format online for free. Works in your browser — no app download, no registration.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Click "Select File" or drag and drop your HEIC or HEIF photo from your iPhone or Mac.',
  'The tool detects and converts your HEIC file to JPG format automatically in your browser.',
  'Click "Download" to save the converted JPG to your device.',
]

const FAQS = [
  {
    q: 'What is a HEIC file and why do iPhones use it?',
    a: 'HEIC (High Efficiency Image Container) is the default photo format used by iPhones since iOS 11. It compresses photos to roughly half the size of JPG at the same visual quality — ideal for iPhone storage, but not universally compatible with other devices and software.',
  },
  {
    q: 'Why can\'t I open HEIC files on my Windows PC?',
    a: 'HEIC is an Apple format. Windows does not natively support it without installing the Microsoft HEVC Video Extensions codec from the Microsoft Store. Converting to JPG is the fastest fix for compatibility.',
  },
  {
    q: 'Will converting HEIC to JPG reduce photo quality?',
    a: 'The conversion uses high-quality settings (92% JPG quality), so photos look excellent. Some minor quality loss is expected since JPG is a lossy format, but it is not noticeable at normal viewing sizes.',
  },
  {
    q: 'Does this work with HEIF files (.heif extension) too?',
    a: 'Yes. HEIC and HEIF are closely related formats from the same HEIF standard. This tool handles both .heic and .heif file extensions.',
  },
  {
    q: 'How do I stop my iPhone from taking HEIC photos?',
    a: 'Go to Settings → Camera → Formats and select "Most Compatible." This saves new photos as JPG instead of HEIC, avoiding the need to convert them later.',
  },
  {
    q: 'Are my iPhone photos kept private during conversion?',
    a: 'Absolutely. All conversion happens locally in your browser using JavaScript. Your photos are never uploaded to any server — they never leave your device.',
  },
]

export default function HeicToJpgPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <HeicToJpgClient />
    </ToolLayout>
  )
}
