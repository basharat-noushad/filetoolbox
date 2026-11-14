import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { SignPdfClient } from './SignPdfClient'

const tool = getToolBySlug('sign-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Sign PDF Online Free — Place Your Signature",
    description: "Sign PDF online for free: draw or upload a signature, drag it onto any page, resize it and add the date. Works in your browser, nothing uploaded.",
    keywords: tool.keywords,
    openGraph: {
      title: "Sign PDF Online Free — Place Your Signature | PDF and Image +",
      description: "Sign PDF online for free: draw or upload a signature, drag it onto any page, resize it and add the date. Works in your browser, nothing uploaded.",
    },
    twitter: {
      title: "Sign PDF Online Free — Place Your Signature | PDF and Image +",
      description: "Sign PDF online for free: draw or upload a signature, drag it onto any page, resize it and add the date. Works in your browser, nothing uploaded.",
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/sign-pdf')
}

const HOW_TO_STEPS = [
  'Upload your PDF, then draw your signature or switch to "Upload signature image" and pick a PNG or JPG.',
  'Click "Add signature to this page", then drag the box to the right spot and drag its corner handle to resize. Use Prev/Next to place it on other pages.',
  'Click "Sign PDF" to embed the signature(s) and download the signed document.',
]

const FAQS = [
  {
    q: 'Is a hand-drawn digital signature legally valid?',
    a: 'In many jurisdictions, electronic signatures are legally binding under laws like the US ESIGN Act and EU eIDAS regulation. However, requirements vary by document type and country. This tool adds a visual signature image; it is not a certificate-based digital signature. For critical legal documents, consult a legal professional.',
  },
  {
    q: 'Does my PDF or signature get uploaded to your servers?',
    a: 'No. All processing happens entirely in your browser using JavaScript. Your PDF file and signature never leave your device — we never see them.',
  },
  {
    q: 'How do I place my signature on a specific page?',
    a: 'After uploading, use Prev/Next to open the page you want, click "Add signature to this page" and drag the box into position. On a phone you can drag it with your finger; with a keyboard, focus the box and use the arrow keys (Shift for bigger steps).',
  },
  {
    q: 'Can I sign several pages or add initials to every page?',
    a: 'Yes. Add a signature on each page you need, or select one placement and click "Apply selected to all pages". Every placement is listed below the preview, and you can remove any of them with the × button.',
  },
  {
    q: 'Does it work on rotated or cropped PDF pages?',
    a: 'Yes. The preview shows each page as it is displayed, and the signature is mapped back to the correct position and orientation, including pages with a /Rotate setting or a cropped page area.',
  },
  {
    q: 'Can I sign a PDF with an image of my signature?',
    a: 'Yes. Choose "Upload signature image" and select a PNG or JPG. PNG transparency is kept. For a JPG with a white background, tick "Remove white background" to make near-white pixels transparent.',
  },
]

export default function SignPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <SignPdfClient />
    </ToolLayout>
  )
}
