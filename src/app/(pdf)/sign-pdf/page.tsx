import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { SignPdfClient } from './SignPdfClient'

const tool = getToolBySlug('sign-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sign PDF Online Free — Electronic Signature | PDF and Image +',
    description: 'Sign PDF documents online with a hand-drawn digital signature. Draw your signature directly in your browser. Free, secure, no registration.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Sign PDF Online Free — Electronic Signature | PDF and Image +',
      description: 'Sign PDF documents online with a hand-drawn digital signature. Draw your signature directly in your browser. Free, secure, no registration.',
    },
    twitter: {
      title: 'Sign PDF Online Free — Electronic Signature | PDF and Image +',
      description: 'Sign PDF documents online with a hand-drawn digital signature. Draw your signature directly in your browser. Free, secure, no registration.',
    },
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload your PDF file using the file selector or drag and drop.',
  'Draw your signature in the signature box using your mouse or touchscreen.',
  'Click "Add Signature to PDF" to embed your signature and download the signed document.',
]

const FAQS = [
  {
    q: 'Is a hand-drawn digital signature legally valid?',
    a: 'In many jurisdictions, electronic signatures are legally binding under laws like the US ESIGN Act and EU eIDAS regulation. However, requirements vary by document type and country. For critical legal documents, consult a legal professional.',
  },
  {
    q: 'Does my PDF or signature get uploaded to your servers?',
    a: 'No. All processing happens entirely in your browser using JavaScript. Your PDF file and signature never leave your device — we never see them.',
  },
  {
    q: 'Where on the PDF is my signature placed?',
    a: 'Your signature is added to the bottom-left corner of the first page of the PDF. For precise signature placement on specific pages, use a dedicated PDF signing application.',
  },
  {
    q: 'Can I sign a multi-page PDF?',
    a: 'Yes, you can upload any PDF. The signature will be placed on the first page. All other pages remain unchanged in the downloaded document.',
  },
  {
    q: 'What if my signature looks messy?',
    a: 'Use the "Clear Signature" button to erase your drawing and start again. Take your time — you can redraw as many times as you like before adding it to the PDF.',
  },
]

export default function SignPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <SignPdfClient />
    </ToolLayout>
  )
}
