import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { withSocialMetadata } from '@/lib/seo'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { HeicToJpgClient } from './HeicToJpgClient'

const tool = getToolBySlug('heic-to-jpg')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "HEIC to JPG Online Free — Bulk, iPhone Photos",
    description: "HEIC to JPG converter online free. Convert up to 20 iPhone HEIC or HEIF photos at once, in your browser. Download JPGs as a ZIP. No sign-up.",
    keywords: tool.keywords,
    alternates: { canonical: '/heic-to-jpg' },
  }, '/heic-to-jpg')
}

const HOW_TO_STEPS = [
  "Select up to 20 .heic or .heif files, each up to 50 MB. Use the original files rather than screenshots or renamed extensions.",
  "Click Convert to JPG. Keep this tab open while your browser converts the files one by one.",
  "Click Download: one file downloads as a JPG, several files as a ZIP. Check orientation and quality before deleting any original."
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
    "q": "Can I bulk convert HEIC to JPG?",
    "a": "Yes, up to 20 files at once, each up to 50 MB. Files are converted one after another with a progress count, and several results download as one ZIP. For a HEIC file containing multiple images, only the first is converted."
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
