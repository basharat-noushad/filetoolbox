import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { BlurImageClient } from './BlurImageClient'

const tool = getToolBySlug('blur-image')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Blur Faces & Background in Photos Free",
    description: "Blur faces in photos automatically, or blur plates, text or the background. Face detection runs in your browser: no sign-up, no upload.",
    keywords: [...tool.keywords, 'blur background of photo', 'blur background online free', 'background blur portrait', 'blur part of image online free', 'blur face in photo', 'blur faces automatically', 'pixelate faces online', 'anonymize faces in photo', 'pixelate part of image', 'censor image'],
    openGraph: {
      title: 'Blur Faces & Background in Photos Free | PDF and Image +',
      description: 'Blur a whole image, selected areas like faces, or the background behind people, free, in your browser. Files never leave your device.',
    },
    twitter: {
      title: 'Blur Faces & Background in Photos Free | PDF and Image +',
      description: 'Blur a whole image or just the background behind people, free, in your browser. Files never leave your device.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/blur-image')
}

const HOW_TO_STEPS = [
  'Upload your JPG, PNG, or WebP image using the file picker or drag and drop.',
  'Choose "Whole image", "Background only" (keeps the person, pet or product sharp), or "Selected areas" and click "Detect faces" or drag boxes over what to hide, then set the strength slider.',
  'Click the blur button, compare the before and after previews, and download the result.',
]

const FAQS = [
  {
    q: 'How do I blur the background of a photo?',
    a: 'Pick "Background only" and click Blur Background. The tool cuts out the main subject with an AI matting model, keeps it sharp, and blurs everything behind it with a lens-style blur. Fine detail like hair is kept, and the colours of the subject do not bleed into the blur. Turn on depth-graded blur for a portrait-mode look where the blur grows with distance.',
  },
  {
    q: 'How do I blur a face, licence plate, or private info in a photo?',
    a: 'Pick "Selected areas" and click "Detect faces" to box faces automatically, or drag a box over each face, plate, address, or line of text, choose Blur or Pixelate, and apply. Use a strong setting for anything sensitive: light blur can sometimes be reversed or guessed, and pixelate with large blocks is harder to undo. Check the result at full size before sharing.',
  },
  {
    q: 'Can it blur or pixelate all faces in a photo automatically?',
    a: 'Yes. In "Selected areas", click Detect faces. Boxes are added over each face it finds, slightly enlarged to cover hair and chin. You can remove any box, draw more, then choose Blur or Pixelate. The detector is tuned for faces within a few metres, so small, distant, side-on or covered faces in group photos can be missed. Always check the boxes and add any missing ones by hand before sharing.',
  },
  {
    q: 'Does background blur work on objects, pets, or products?',
    a: 'Yes. Leave the subject on Auto, or pick "Any subject (pets, products)". If a face is found it uses a portrait model tuned for people and hair, otherwise a general subject model. It works best when the subject stands out from the background; busy scenes with several similar objects can confuse it.',
  },
  {
    q: 'Is my photo uploaded to a server?',
    a: 'No. All modes run in your browser. The AI models are served from this site and run on your device, so your image never leaves it. The first background blur downloads a model once (about 26 MB for people, 5 MB for other subjects, plus 27 MB if you enable depth blur); your browser keeps it for later visits.',
  },
  {
    q: 'What blur strength should I use?',
    a: 'A radius of 5-15 gives a soft look. 20-35 gives a strong portrait-style background blur. 40-50 is extreme, useful for privacy or artistic effects.',
  },
  {
    q: 'Will the image size or quality change?',
    a: 'No. The output keeps the original dimensions and format (PNG stays PNG, JPG stays JPG). Only the blurred or pixelated areas change.',
  },
]

export default function BlurImagePage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <BlurImageClient />
    </ToolLayout>
  )
}
