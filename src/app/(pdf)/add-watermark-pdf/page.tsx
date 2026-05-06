import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { AddWatermarkPdfClient } from './AddWatermarkPdfClient'

const tool = getToolBySlug('add-watermark-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Add Watermark to PDF Online Free | PDF and Image +',
    description: 'Add a text watermark to every page of your PDF online. Control opacity, font size, and rotation. Free, no registration, browser-based.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Add Watermark to PDF Online Free | PDF and Image +',
      description: 'Add a text watermark to every page of your PDF online. Control opacity, font size, and rotation. Free, no registration, browser-based.',
    },
    twitter: {
      title: 'Add Watermark to PDF Online Free | PDF and Image +',
      description: 'Add a text watermark to every page of your PDF online. Control opacity, font size, and rotation. Free, no registration, browser-based.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file by dragging and dropping it into the upload area or clicking to browse.',
  'Enter your watermark text and adjust the opacity, font size, and rotation angle to your preference.',
  'Click "Add Watermark" and download your watermarked PDF instantly.',
]

const FAQS = [
  { q: 'Can I control how visible the watermark is?', a: 'Yes. Use the opacity slider to set transparency between 10% and 90%. A lower value makes the watermark more subtle, while a higher value makes it more prominent.' },
  { q: 'What angle is the watermark displayed at?', a: 'By default the watermark is rotated at 45 degrees diagonally across the page, but you can change this to any angle using the rotation input.' },
  { q: 'Will the watermark appear on every page?', a: 'Yes, the watermark is applied to every page of the PDF document automatically.' },
  { q: 'Is the watermark permanent?', a: 'The watermark is embedded into the PDF content, making it persistent. However, it is not cryptographically enforced — determined users with PDF editing tools could attempt to remove it.' },
  { q: 'Are my files uploaded to a server?', a: 'No. All processing happens entirely in your browser. Your PDF never leaves your device, keeping your files completely private.' },
]

export default function AddWatermarkPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <AddWatermarkPdfClient />
    </ToolLayout>
  )
}
