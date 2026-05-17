import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ImageToBase64Client } from './ImageToBase64Client'

const tool = getToolBySlug('image-to-base64')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Image to Base64 Encoder Online Free — Convert to Base64',
    description: 'Convert images to Base64 encoded strings online for free. Useful for embedding images in HTML, CSS, or JSON data. Copy and use instantly.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Image to Base64 Converter Free Online | PDF and Image +',
      description: 'Convert images to Base64 encoded strings for embedding in HTML, CSS, or JSON. Free and instant.',
    },
    twitter: {
      title: 'Image to Base64 Converter Free Online | PDF and Image +',
      description: 'Convert images to Base64 encoded strings for embedding in HTML, CSS, or JSON. Free and instant.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your JPG, PNG, WebP, or GIF image using the file picker or drag and drop.',
  'Click "Convert to Base64" and the tool will encode your image as a data URL string.',
  'Copy the generated Base64 string using the "Copy" button and paste it wherever you need it.',
]

const FAQS = [
  {
    q: 'What is Base64 encoding for images?',
    a: 'Base64 encoding converts binary image data into a text string (data URL). This lets you embed images directly into HTML, CSS, or JSON without needing a separate file.',
  },
  {
    q: 'How do I use the Base64 string in HTML?',
    a: 'Use it as the src attribute: <img src="data:image/png;base64,YOUR_STRING_HERE" />. The full data URL output from this tool is ready to paste.',
  },
  {
    q: 'Does the file size increase after Base64 encoding?',
    a: 'Yes. Base64 encoding increases the data size by approximately 33% compared to the original binary file.',
  },
  {
    q: 'Are there any file size limits?',
    a: 'Very large images may produce extremely long strings. For practical use in HTML or CSS, keep images under 100KB before encoding.',
  },
  {
    q: 'Is my image uploaded to a server?',
    a: 'No. Everything happens in your browser. Your image is read locally using the FileReader API and never sent to any server.',
  },
]

export default function ImageToBase64Page() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ImageToBase64Client />
    </ToolLayout>
  )
}
