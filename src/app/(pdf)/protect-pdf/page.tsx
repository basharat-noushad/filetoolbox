import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ProtectPdfClient } from './ProtectPdfClient'

const tool = getToolBySlug('protect-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: 'Protect PDF — Add Password to PDF Free Online',
    description: 'Password protect PDF files free with AES-256 encryption. It runs entirely in your browser, so your file and password never leave your device. No sign-up.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Protect PDF — Add Password to PDF Free Online | PDF and Image +',
      description: 'Add password protection to your PDF files online for free. Secure sensitive documents. No registration required.',
    },
    twitter: {
      title: 'Protect PDF — Add Password to PDF Free Online | PDF and Image +',
      description: 'Add password protection to your PDF files online for free. Secure sensitive documents. No registration required.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/protect-pdf')
}

const HOW_TO_STEPS = [
  'Upload the PDF file you want to protect by dragging it into the upload area or clicking to browse.',
  'Enter a strong password and confirm it in the second field to prevent typos.',
  'Click "Protect PDF" and download your password-protected PDF instantly.',
]

const FAQS = [
  {
    q: 'What password strength should I use?',
    a: 'Use a minimum of 10 characters combining uppercase letters, lowercase letters, numbers, and symbols. Avoid obvious choices like your name, "1234," or the document title. A password manager can generate and store a strong random password for you.',
  },
  {
    q: 'Can I use any password characters?',
    a: 'Yes. Any combination of letters, numbers, and symbols is supported. Longer passwords with mixed character types provide stronger protection.',
  },
  {
    q: 'What happens if I forget the password?',
    a: 'There is no password recovery option for encrypted PDFs. If you lose the password, the file cannot be opened. Store your password in a secure location — a password manager is ideal — before sharing the protected PDF.',
  },
  {
    q: 'Are my files sent to a server during protection?',
    a: 'No. The encryption (AES-256) is applied entirely in your browser. Your PDF and password never leave your device and are never uploaded to any server, so it is safe to use for confidential documents.',
  },
  {
    q: 'Can I remove the password later?',
    a: 'Yes. Use the Unlock PDF tool on this site. Upload the protected PDF and enter the correct password to remove the protection and download an unlocked copy.',
  },
  {
    q: 'How should I share the password with the recipient?',
    a: 'Never send the password in the same email as the protected PDF. Share the password through a different channel — a phone call, text message, or encrypted messaging app — so that both pieces are not intercepted together.',
  },
]

export default function ProtectPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ProtectPdfClient />
    </ToolLayout>
  )
}
