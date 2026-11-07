import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { withSocialMetadata } from '@/lib/seo'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { HeicToJpgClient } from './HeicToJpgClient'

const tool = getToolBySlug('heic-to-jpg')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "HEIC to JPG Converter Free — Convert iPhone Photos",
    description: "Convert a HEIC or HEIF photo to JPG free in your browser. Make iPhone photos easier to share on Windows and other devices. One file up to 50 MB.",
    keywords: tool.keywords,
    alternates: { canonical: '/heic-to-jpg' },
  }, '/heic-to-jpg')
}

const HOW_TO_STEPS = [
  "Select one .heic or .heif file up to 50 MB. Use the original file rather than a screenshot or a renamed extension.",
  "Click Convert to JPG. Keep this tab open while your browser decodes the photo.",
  "Click Download to save converted.jpg. Check orientation and quality before deleting or replacing any original."
]
const FAQS = [
  {
    "q": "How can I convert HEIC to JPG on Windows?",
    "a": "Open this converter in a current browser on Windows, select the HEIC file, click Convert to JPG and download the result. You do not need a separate desktop converter for this workflow."
  },
  {
    "q": "Does this converter upload my iPhone photos?",
    "a": "The HEIC decoder runs in your browser. Your selected file is not uploaded for conversion. Large photos can take more time and memory on mobile devices."
  },
  {
    "q": "Can I batch convert HEIC files to JPG?",
    "a": "The current tool converts one file at a time, up to 50 MB. For a file containing multiple images, it returns the first converted image. It does not create a batch ZIP."
  },
  {
    "q": "Will my photo lose quality or metadata?",
    "a": "JPG is lossy and this tool exports at a quality setting of 92%. Do not rely on preservation of EXIF, camera metadata, HDR information or auxiliary images. Keep the HEIC original."
  },
  {
    "q": "Why does my HEIC file fail to convert?",
    "a": "It may be damaged, use an unsupported encoding, or exceed your browser memory. Try a smaller original file in a current desktop browser. Changing the extension to .jpg does not convert the image."
  }
]

export default function Page() {
  return <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}><HeicToJpgClient /></ToolLayout>
}
