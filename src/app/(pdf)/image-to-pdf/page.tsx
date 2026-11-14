import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { JpgToPdfClient } from '../jpg-to-pdf/JpgToPdfClient'

const tool = getToolBySlug('image-to-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Image to PDF Converter Online Free",
    description: "Convert images to PDF online free. Mix JPG, PNG, WebP, GIF, BMP or AVIF files, in the order you pick them, and get one PDF. No upload, no sign-up.",
    keywords: tool.keywords,
    openGraph: {
      title: "Image to PDF Converter Online Free | PDF and Image +",
      description: "Convert images to PDF online free. Mix JPG, PNG, WebP, GIF, BMP or AVIF files, in the order you pick them, and get one PDF. No upload, no sign-up.",
    },
    twitter: {
      title: "Image to PDF Converter Online Free | PDF and Image +",
      description: "Convert images to PDF online free. Mix JPG, PNG, WebP, GIF, BMP or AVIF files, in the order you pick them, and get one PDF. No upload, no sign-up.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/image-to-pdf')
}

const HOW_TO_STEPS = [
  "Add your images of any supported type: JPG, PNG, WebP, GIF, BMP or AVIF.",
  "Make sure the files are in the order you want. Each image becomes one page.",
  "Click \"Convert to PDF\" and download the combined document.",
]

const FAQS = [
  { q: "Which image formats can I turn into a PDF?", a: "JPG, PNG, WebP, GIF, BMP and AVIF. JPG and PNG are embedded as they are. The other formats are redrawn by your browser and embedded as PNG, so the browser must be able to open them." },
  { q: "Can I mix different formats in one PDF?", a: "Yes. You can add a JPG photo, a PNG screenshot and a WebP picture in the same batch and they all end up in one PDF, one image per page." },
  { q: "How do I control the page order?", a: "Pages follow the order of the files in the list, which is the order you selected or dropped them. To change it, clear the list and add the files again in the order you want." },
  { q: "What happens to animated GIFs and WebP files?", a: "Only the first frame is used, because a PDF page is a still image." },
  { q: "Do the pages have a fixed size like A4?", a: "No. Each page matches the size of its image, so a PDF from mixed images can have pages of different sizes." },
  { q: "Is there a limit on files or file size?", a: "You can add up to 20 images at a time. Large images work, but very big batches can be slow because everything runs on your own device." },
]

export default function ImageToPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <JpgToPdfClient accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'], 'image/gif': ['.gif'], 'image/bmp': ['.bmp'], 'image/avif': ['.avif'] }} label="Drag & drop your images here" sublabel="JPG, PNG, WebP, GIF, BMP, AVIF — mix formats freely" formats="supported" />
    </ToolLayout>
  )
}
