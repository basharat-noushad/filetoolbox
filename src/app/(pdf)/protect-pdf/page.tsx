import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ProtectPdfClient } from './ProtectPdfClient'

const tool = getToolBySlug('protect-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Protect PDF — Add Password to PDF Free Online',
    description: 'Add password protection to your PDF files online. Secure sensitive documents with encryption. Free, no registration, files stay private.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Protect PDF — Add Password to PDF Free Online | PDF and Image +',
      description: 'Add password protection to your PDF files online. Secure sensitive documents with encryption. Free, no registration, files stay private.',
    },
    twitter: {
      title: 'Protect PDF — Add Password to PDF Free Online | PDF and Image +',
      description: 'Add password protection to your PDF files online. Secure sensitive documents with encryption. Free, no registration, files stay private.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }
}

const HOW_TO_STEPS = [
  'Upload the PDF file you want to protect by dragging it in or clicking to browse.',
  'Enter a strong password and confirm it in the second field to avoid typos.',
  'Click "Protect PDF" and download your password-protected PDF.',
]

const FAQS = [
  { q: 'What level of encryption is applied?', a: 'This tool uses pdf-lib to apply password protection, which provides a standard level of PDF encryption. For bank-grade or enterprise-grade encryption, consider a dedicated server-side solution.' },
  { q: 'Can I use any password?', a: 'Yes, you can use any combination of letters, numbers, and symbols. A longer, more complex password provides better security.' },
  { q: 'What happens if I forget the password?', a: 'There is no way to recover a forgotten PDF password. Make sure to store your password in a safe place, such as a password manager.' },
  { q: 'Are my files sent to a server?', a: 'No. All processing happens entirely in your browser. Neither your file nor your password is ever sent to any server, ensuring complete privacy.' },
  { q: 'Can I remove the password later?', a: 'Yes. Use the Unlock PDF tool on this site. Simply upload the protected PDF and enter the correct password to remove protection.' },
]

export default function ProtectPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ProtectPdfClient />
    </ToolLayout>
  )
}
