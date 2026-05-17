import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { RotatePdfClient } from './RotatePdfClient'

const tool = getToolBySlug('rotate-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Rotate PDF Online Free — Rotate PDF Pages',
    description: 'Rotate PDF pages online for free. Rotate all or specific pages by 90°, 180°, or 270°. Fix scanned documents instantly.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Rotate PDF Online Free — Rotate PDF Pages | PDF and Image +',
      description: 'Rotate PDF pages online for free. Rotate all or specific pages by 90°, 180°, or 270°. Fix scanned documents instantly.',
    },
    twitter: {
      title: 'Rotate PDF Online Free — Rotate PDF Pages | PDF and Image +',
      description: 'Rotate PDF pages online for free. Rotate all or specific pages by 90°, 180°, or 270°. Fix scanned documents instantly.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file by clicking "Select File" or dragging and dropping.',
  'Choose the rotation angle: 90° left, 90° right, or 180°.',
  'Select whether to rotate all pages or specific pages, then click "Rotate PDF".',
]

const FAQS = [
  { q: 'Can I rotate only specific pages?', a: 'Yes. Enter specific page numbers (e.g. "1, 3, 5") to rotate only those pages, or rotate all pages at once.' },
  { q: 'What rotation angles are supported?', a: '90° clockwise, 90° counter-clockwise, and 180° rotation are all supported.' },
  { q: 'Will the rotation be saved permanently?', a: 'Yes. The downloaded PDF has the rotation permanently applied — it will display correctly everywhere.' },
  { q: 'Can I rotate a scanned PDF?', a: 'Yes. This tool works with all PDF types including scanned documents.' },
  { q: 'Why is my PDF displaying sideways?', a: 'This usually happens when a document was scanned in the wrong orientation, or exported from an app that did not embed the correct page rotation. Rotating here fixes it permanently.' },
  { q: 'Will rotation affect the file size?', a: 'Rotation causes only a negligible change in file size — typically a few kilobytes. The visual content is not re-encoded.' },
]

export default function RotatePdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <RotatePdfClient />
    </ToolLayout>
  )
}
