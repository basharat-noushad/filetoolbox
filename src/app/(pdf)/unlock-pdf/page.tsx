import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { UnlockPdfClient } from './UnlockPdfClient'

const tool = getToolBySlug('unlock-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: 'Unlock PDF — Remove Password from PDF Free Online',
    description: 'Remove a password from a PDF free. Enter the password and get an unlocked copy instantly, processed in your browser so your file never leaves your device.',
    keywords: tool.keywords,
    openGraph: {
      title: 'Unlock PDF — Remove Password from PDF Free Online | PDF and Image +',
      description: 'Remove a password from a PDF free. Enter the password and get an unlocked copy instantly, processed in your browser so your file never leaves your device.',
    },
    twitter: {
      title: 'Unlock PDF — Remove Password from PDF Free Online | PDF and Image +',
      description: 'Remove a password from a PDF free. Enter the password and get an unlocked copy instantly, processed in your browser so your file never leaves your device.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/unlock-pdf')
}

const HOW_TO_STEPS = [
  'Upload your password-protected PDF by dragging it into the upload area or clicking to browse.',
  'Enter the current PDF password in the password field provided.',
  'Click "Unlock PDF" and download the unlocked version immediately.',
]

const FAQS = [
  { q: 'Do I need to know the password to unlock a PDF?', a: 'Yes. This tool removes password protection from PDFs you own and already know the password for. It does not bypass or crack unknown passwords.' },
  { q: 'Is this tool safe for sensitive documents?', a: 'Yes. The password is removed entirely in your browser. Your file and password never leave your device and are never uploaded to a server, which makes it suitable for bank statements, payslips, and other private files.' },
  { q: 'What types of PDF passwords does this remove?', a: 'This tool removes the open (user) password that prevents opening the file. It uses your provided password to decrypt and re-save the PDF without protection.' },
  { q: 'What if I get a wrong password error?', a: 'Double-check you are entering the correct password. Passwords are case-sensitive. If you do not know the password, this tool cannot help — it does not crack passwords.' },
  { q: 'Can I then edit the unlocked PDF?', a: 'Yes. Once unlocked, you can open the PDF in any viewer or editor without being prompted for a password.' },
]

export default function UnlockPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <UnlockPdfClient />
    </ToolLayout>
  )
}
