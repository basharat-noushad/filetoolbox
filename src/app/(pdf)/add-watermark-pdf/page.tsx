import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { AddWatermarkPdfClient } from './AddWatermarkPdfClient'

const tool = getToolBySlug('add-watermark-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Add Watermark to PDF Online Free — Text Watermark Tool',
    description: 'Add a custom text watermark to every page of your PDF online for free. Control opacity, font size, and rotation. No registration, browser-based.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Add Watermark to PDF Online Free — Text Watermark Tool | PDF and Image +',
      description: 'Add a custom text watermark to every page of your PDF online for free. Control opacity, font size, and rotation.',
    },
    twitter: {
      title: 'Add Watermark to PDF Online Free — Text Watermark Tool | PDF and Image +',
      description: 'Add a custom text watermark to every page of your PDF online for free. Control opacity, font size, and rotation.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file by dragging and dropping it into the upload area or clicking to browse.',
  'Enter your watermark text and adjust the opacity, font size, and rotation angle.',
  'Click "Add Watermark" and download your watermarked PDF instantly.',
]

const FAQS = [
  {
    q: 'Can I control how visible the watermark is?',
    a: 'Yes. Use the opacity slider to set transparency between 10% and 90%. A lower value makes the watermark subtle and unobtrusive, while a higher value makes it prominent — useful for "DRAFT" or "CONFIDENTIAL" markings.',
  },
  {
    q: 'What angle is the watermark displayed at?',
    a: 'By default the watermark is rotated 45 degrees diagonally across the page. You can change this to any angle using the rotation input — including 0 degrees for a horizontal watermark.',
  },
  {
    q: 'Will the watermark appear on every page?',
    a: 'Yes. The watermark is applied uniformly to every page of the PDF document.',
  },
  {
    q: 'Can the watermark be removed by the recipient?',
    a: 'The watermark is embedded directly into the PDF page content. While it is persistent and cannot be removed without a PDF editing tool, it does not provide cryptographic protection. For documents requiring true tamper protection, combine watermarking with password protection.',
  },
  {
    q: 'Are my files sent to a server?',
    a: 'No. All processing happens entirely in your browser. Your PDF never leaves your device, ensuring complete privacy for sensitive documents.',
  },
]

export default function AddWatermarkPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <AddWatermarkPdfClient />
    </ToolLayout>
  )
}
