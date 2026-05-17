import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { CropPdfClient } from './CropPdfClient'

const tool = getToolBySlug('crop-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Crop PDF Online Free — Trim PDF Margins and Pages',
    description: 'Crop or trim the margins of any PDF document online for free. Set custom margins for all sides. Instant and free, no registration required.',
    keywords: tool.keywords,
    openGraph: { title: 'Crop PDF Online Free | PDF and Image +', description: 'Crop PDF margins online for free. Set top, right, bottom, and left margins. Instant processing.' },
    twitter: { title: 'Crop PDF Online Free | PDF and Image +', description: 'Crop PDF margins online for free. Set top, right, bottom, and left margins. Instant processing.' },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload the PDF file you want to crop.',
  'Enter the margin values (in points) for Top, Right, Bottom, and Left sides.',
  'Click "Crop PDF" and download your trimmed PDF document.',
]

const FAQS = [
  { q: 'What unit are the margins in?', a: 'Margins are in PDF points (pt). 1 inch = 72 points. So to remove a 1-inch margin, enter 72.' },
  { q: 'Can I crop all pages at once?', a: 'Yes. The margin settings apply to all pages in the PDF simultaneously.' },
  { q: 'Will cropping affect the actual content?', a: 'Cropping sets the visible area (crop box) of the PDF. Content outside the crop box is hidden but technically still present in the file.' },
  { q: 'What if I enter margins that are too large?', a: 'If margins exceed the page size, the cropped area may become very small or empty. Use reasonable values based on your page dimensions.' },
]

export default function CropPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <CropPdfClient />
    </ToolLayout>
  )
}
