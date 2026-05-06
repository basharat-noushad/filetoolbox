import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { FlattenPdfClient } from './FlattenPdfClient'

const tool = getToolBySlug('flatten-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Flatten PDF Form Fields Online Free | PDF and Image +',
    description: 'Flatten PDF forms and annotations into a static, non-editable document. Prevent form editing and preserve appearance. Free online tool.',
    keywords: tool.keywords,
    openGraph: { title: 'Flatten PDF Form Fields Online Free | PDF and Image +', description: 'Flatten PDF forms and annotations into a static document. Free, browser-based, no registration.' },
    twitter: { title: 'Flatten PDF Form Fields Online Free | PDF and Image +', description: 'Flatten PDF forms and annotations into a static document. Free, browser-based, no registration.' },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file containing form fields or annotations.',
  'Click "Flatten PDF" to merge all form fields into static content.',
  'Download your flattened PDF — form fields are now permanent and non-editable.',
]

const FAQS = [
  { q: 'What does flattening a PDF do?', a: 'Flattening merges all interactive form fields, annotations, and overlays into the static page content, making them permanent and non-editable.' },
  { q: 'Can I still read filled-in form values after flattening?', a: 'Yes. All filled-in values remain visible in the flattened PDF — they just cannot be edited anymore.' },
  { q: 'Why would I flatten a PDF?', a: 'Common reasons include: preventing others from changing filled form data, ensuring the document looks the same across all PDF viewers, and reducing file size.' },
  { q: 'Is flattening reversible?', a: 'No. Once a PDF is flattened, form fields and annotations cannot be recovered. Make sure to keep a backup of the original if needed.' },
  { q: 'Are my files safe?', a: 'Yes. All processing happens entirely in your browser. Your files are never uploaded to any server.' },
]

export default function FlattenPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <FlattenPdfClient />
    </ToolLayout>
  )
}
