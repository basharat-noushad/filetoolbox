import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { JpgToPdfClient } from '../jpg-to-pdf/JpgToPdfClient'

const tool = getToolBySlug('png-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "PNG to PDF Converter Online Free",
    description: "Convert PNG to PDF online free. Combine several PNG images into one PDF, keep them in the order you add them, and stay private in your browser.",
    keywords: tool.keywords,
    openGraph: {
      title: "PNG to PDF Converter Online Free | PDF and Image +",
      description: "Convert PNG to PDF online free. Combine several PNG images into one PDF, keep them in the order you add them, and stay private in your browser.",
    },
    twitter: {
      title: "PNG to PDF Converter Online Free | PDF and Image +",
      description: "Convert PNG to PDF online free. Combine several PNG images into one PDF, keep them in the order you add them, and stay private in your browser.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/png-to-pdf')
}

const HOW_TO_STEPS = [
  "Select your PNG images, or drag them into the upload area.",
  "Drag the images (or use the up/down arrows) into the order you want. Pages follow the list.",
  "Click \"Convert to PDF\" and download your PDF.",
]

const FAQS = [
  { q: "What happens to transparent areas in my PNG?", a: "PDF pages are drawn on a white sheet, so transparent pixels show as white when you view or print the PDF. The transparency itself is kept in the file, so it will also sit correctly over a coloured background in editors that support it." },
  { q: "What page size does the PDF use?", a: "Each page takes the pixel size of its PNG, so a 1200 by 800 image makes a 1200 by 800 point page. The PDF is not forced onto A4 or Letter." },
  { q: "Will the PNG be recompressed or lose quality?", a: "No. PNG data is embedded losslessly, so screenshots, diagrams and text stay crisp. Large PNGs can still make a big PDF." },
  { q: "Can I combine many PNGs into a single PDF?", a: "Yes, up to 20 PNG files at once. Each image becomes its own page, in the order of the list." },
  { q: "Why convert screenshots to PDF?", a: "A PDF is easy to email, print, and archive as one file, and it keeps a set of screenshots together in a fixed order instead of a loose folder of images." },
  { q: "Are my PNG files uploaded?", a: "No. The PDF is built in your browser and your images never leave your device." },
]

export default function PngToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <JpgToPdfClient accept={{ 'image/png': ['.png'] }} label="Drag & drop PNG images here" sublabel="Select several PNGs — each becomes one page" formats="PNG" />
    </ToolLayout>
  )
}
