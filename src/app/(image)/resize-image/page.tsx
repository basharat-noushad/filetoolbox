import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ResizeImageClient } from './ResizeImageClient'

const tool = getToolBySlug('resize-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Resize Image in cm, KB or px Online Free",
    description: "Resize image in cm, mm, inches or pixels online free. Set DPI and a max file size in KB, resize up to 20 images at once. Runs in your browser.",
    keywords: tool.keywords,
    openGraph: {
      title: "Resize Image in cm, KB or px Online Free | PDF and Image +",
      description: "Resize image in cm, mm, inches or pixels online free. Set DPI and a max file size in KB, resize up to 20 images at once. Runs in your browser.",
    },
    twitter: {
      title: "Resize Image in cm, KB or px Online Free | PDF and Image +",
      description: "Resize image in cm, mm, inches or pixels online free. Set DPI and a max file size in KB, resize up to 20 images at once. Runs in your browser.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/resize-image')
}

const HOW_TO_STEPS = [
  'Upload one image or up to 20 by clicking "Select Files" or dragging and dropping.',
  'Pick a unit (px, cm, mm or in), set the DPI, and enter width and height, or choose a preset or passport size. Add a max file size in KB if you need one.',
  'Click "Resize Image" and download your file, or one ZIP when you resized several.',
]

const FAQS = [
  { q: 'How do I resize an image in cm?', a: 'Choose cm as the unit, set a DPI (300 is standard for print) and enter the size. The tool converts it to pixels as inches times DPI and shows the exact result, for example 35 x 45 mm at 300 DPI is 413 x 531 px.' },
  { q: 'Is the DPI saved in the file?', a: 'Yes for JPG and PNG, so print size is read correctly by editors and print shops. WebP files do not store DPI.' },
  { q: 'Can I make a passport size photo?', a: 'The ID presets (US 2x2 in, 35x45 mm, 50x70 mm, 33x48 mm) set the exact size at 300 DPI and centre-crop your photo to fit. Check the current official rules for head size and background; this tool does not guarantee acceptance.' },
  { q: 'How do I resize an image to 100 KB or 50 KB?', a: 'Enter the size you want in "Max file size (KB)". The image is resized to your dimensions first, then JPG or WebP quality is lowered until the file fits. 1 KB is 1000 bytes. If the size cannot be reached at those dimensions, the picture is shrunk further and you are told the final size.' },
  { q: 'Why did my PNG become a JPG?', a: 'PNG cannot be made smaller by lowering quality, so when a max file size is set and the PNG is too big, it is saved as JPG. Transparent areas turn white. Without a size limit, PNG stays PNG.' },
  { q: 'Can I resize multiple images at once?', a: 'Yes, up to 20. The same settings apply to all and you get a ZIP. With the aspect ratio lock on and only a width entered, each image keeps its own ratio, so heights differ. Passport presets crop each photo to the exact size.' },
]

export default function ResizeImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ResizeImageClient />
    </ToolLayout>
  )
}
