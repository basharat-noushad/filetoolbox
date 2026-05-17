import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { AddTextToImageClient } from './AddTextToImageClient'

const tool = getToolBySlug('add-text-to-image')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Add Text to Image Online Free — Write on Photos',
    description: 'Add custom text to photos and images online for free. Choose font size and color. Perfect for captions, labels, and quotes. No registration.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Add Text to Image Online Free — Photo Text Editor | PDF and Image +',
      description: 'Add custom text to photos and images online for free. Choose font size and color.',
    },
    twitter: {
      title: 'Add Text to Image Online Free — Photo Text Editor | PDF and Image +',
      description: 'Add custom text to photos and images online for free. Choose font size and color.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your JPG, PNG, or WebP image using the file picker or drag and drop.',
  'Type the text you want to add, then choose a font size using the slider and pick a text color.',
  'Click "Add Text to Image" to apply the text and download your finished image.',
]

const FAQS = [
  {
    q: 'Where does the text appear on the image?',
    a: 'Text is placed near the top-left of the image by default. It includes a dark stroke outline for readability on both light and dark backgrounds.',
  },
  {
    q: 'Can I choose the font?',
    a: 'The tool uses Arial Bold for clean, universal rendering. Custom font selection is not currently supported.',
  },
  {
    q: 'What font sizes are available?',
    a: 'You can set any font size from 12px to 200px using the slider. For most images, 48–96px works well.',
  },
  {
    q: 'Can I add multiple lines of text?',
    a: 'Currently, the tool adds a single line of text. Multi-line and positioned text will be added in a future update.',
  },
  {
    q: 'Is my image kept private?',
    a: 'Yes. All processing happens in your browser using the Canvas API. Your image is never uploaded to any server.',
  },
]

export default function AddTextToImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <AddTextToImageClient />
    </ToolLayout>
  )
}
