import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ImageToTextClient } from './ImageToTextClient'

const tool = getToolBySlug('image-to-text')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Image to Text Converter Online Free",
    description: "Image to text converter with OCR: extract text from a photo, screenshot or scan in your browser. Paste with Ctrl+V, copy or save as .txt.",
    keywords: tool.keywords,
    openGraph: {
      title: "Image to Text Converter Online Free | PDF and Image +",
      description: "Image to text converter with OCR: extract text from a photo, screenshot or scan in your browser. Paste with Ctrl+V, copy or save as .txt.",
    },
    twitter: {
      title: "Image to Text Converter Online Free | PDF and Image +",
      description: "Image to text converter with OCR: extract text from a photo, screenshot or scan in your browser. Paste with Ctrl+V, copy or save as .txt.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/image-to-text')
}

const HOW_TO_STEPS = [
  "Upload a JPG, PNG or WebP image, or paste a screenshot with Ctrl+V.",
  "Pick the language of the text and click \"Extract Text\".",
  "Copy the recognised text or download it as a .txt file.",
]

const FAQS = [
  { q: "Is this image to text converter free?", a: "Yes. It is free, needs no sign-up and has no daily limit." },
  { q: "Is my image uploaded to a server?", a: "No. Recognition runs in your browser with Tesseract.js, so the image stays on your device. Choosing a language other than English downloads that language's data file once; the image itself is never sent." },
  { q: "How accurate is it?", a: "Best on clear, printed text with good contrast, such as screenshots, scanned pages and document photos. Handwriting, stylised fonts, blurry photos and text on busy backgrounds give poor results, and you should proofread the output." },
  { q: "Can I paste a screenshot instead of uploading a file?", a: "Yes. Press Ctrl+V (or Cmd+V on Mac) anywhere on the page after copying an image or taking a screenshot." },
  { q: "Which languages are supported?", a: "English, Spanish, French, German and Simplified Chinese. Pick the one that matches your text before you start." },
  { q: "Why is the first run slower?", a: "The OCR engine and language data are loaded on the first run. After that, recognition is faster." },
]

export default function ImageToTextPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ImageToTextClient />
    </ToolLayout>
  )
}
