import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { RemoveBackgroundClient } from './RemoveBackgroundClient'

const tool = getToolBySlug('remove-background')!
const title = 'Remove Image Background or Make It White Online'
const description = 'Remove a photo background with AI, then make it white or keep it transparent. Download a PNG or save a solid background as JPG.'

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title,
    description,
    keywords: tool.keywords,
    openGraph: {
      title: `${title} | PDF and Image`,
      description,
    },
    twitter: {
      title: `${title} | PDF and Image`,
      description,
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/remove-background')
}

const HOW_TO_STEPS = [
  'Select a JPG, PNG or WebP photo up to 4 MB and click "Remove Background". An AI service cuts out the subject.',
  'Choose White for a plain background, or leave Transparent selected if you want to place the cutout on another design.',
  'Download the PNG, or choose "Save as JPG" for an image with a solid background.',
]

const FAQS = [
  {
    q: 'What types of images work best for background removal?',
    a: 'Photos with a clear subject and contrasting background work best — portraits, product shots, animals, vehicles, and logos. High-contrast photos with a defined subject produce the most accurate results.',
  },
  {
    q: 'What format is the output file?',
    a: 'With a transparent background the output is a PNG. If you pick a solid background colour you can download it as PNG or as a smaller JPG.',
  },
  {
    q: 'Is background removal really free?',
    a: 'Yes. There are no watermarks and no registration. Because each removal uses a paid AI service, there is a fair-use limit on how many images you can process per hour, and uploads are limited to 4 MB.',
  },
  {
    q: 'How accurate is the AI at removing backgrounds?',
    a: 'Accuracy is very high for photos with clear, high-contrast subjects. Hair, fur, and transparent objects (glasses, bottles) are more challenging and may have slightly imprecise edges. For professional use, the AI result makes an excellent starting point for manual refinement.',
  },
  {
    q: 'Is my photo uploaded to a server?',
    a: 'Yes. Your photo is sent over HTTPS to a third-party AI background-removal service, which returns the transparent PNG. Only upload images you are comfortable sending to an online service.',
  },
  {
    q: 'How do I make the background of a product photo white?',
    a: 'Click Remove Background, then select White under Background. Check the edges of the product before downloading. You can try other colours in the browser without sending the photo to the AI service again.',
  },
]

export default function RemoveBackgroundPage() {
  return (
    <ToolLayout tool={tool} howToTitle="How to remove or replace a photo background" howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <RemoveBackgroundClient />
    </ToolLayout>
  )
}
