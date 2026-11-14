import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getToolBySlug } from '@/lib/toolsRegistry'
import { ToolLayout } from '@/components/tools/ToolLayout'
import { ProtectPdfClient } from './ProtectPdfClient'

const tool = getToolBySlug('protect-pdf')!

export async function generateMetadata(): Promise<Metadata> {
  return withSocialMetadata({
    title: "Protect PDF Online Free — Password & Permissions",
    description: "Protect PDF online free: add an AES-256 password or block printing, copying and editing. Runs in your browser, so files never leave your device.",
    keywords: tool.keywords,
    openGraph: {
      title: "Protect PDF Online Free — Password & Permissions | PDF and Image +",
      description: 'Password protect a PDF or restrict printing, copying and editing. Free, in your browser, no sign-up.',
    },
    twitter: {
      title: "Protect PDF Online Free — Password & Permissions | PDF and Image +",
      description: 'Password protect a PDF or restrict printing, copying and editing. Free, in your browser, no sign-up.',
    },
    alternates: { canonical: `/${tool.slug}` },
  }, '/protect-pdf')
}

const HOW_TO_STEPS = [
  'Upload the PDF file you want to protect by dragging it into the upload area or clicking to browse.',
  'Choose "Password to open" to encrypt the file, or "Restrict only" to lock it from printing, copying or editing. Enter or generate a password and pick the permissions.',
  'Click "Protect PDF" and download your protected PDF instantly.',
]

const FAQS = [
  {
    q: 'What is the difference between "Password to open" and "Restrict only"?',
    a: '"Password to open" encrypts the whole PDF with AES-256, so nobody can view it without the password. "Restrict only" lets anyone open and read the file, but tells PDF readers to block printing, copying or editing. Acrobat and similar editors ask for the permissions password before the restrictions can be changed.',
  },
  {
    q: 'Can I protect a PDF from editing, copying or printing?',
    a: 'Yes. Untick "Allow copying text and images" or "Allow editing", or set printing to "Low resolution only" or "Not allowed". Adobe Acrobat, web browsers, macOS Preview and most other readers respect these settings and disable the blocked actions.',
  },
  {
    q: 'How strong are permission restrictions?',
    a: 'They are a polite lock, not a safe. Compliant readers honour them, but some PDF tools ignore them, and anyone who can open the file can still view and screenshot it. If the content must stay private, use "Password to open", which is the only option that truly encrypts it.',
  },
  {
    q: 'What happens if I forget the password?',
    a: 'There is no recovery. A lost open password means the file cannot be opened, and a lost permissions password means Acrobat and similar editors will not let you change the restrictions. Store passwords in a password manager, and copy a generated password before creating the PDF.',
  },
  {
    q: 'Are my files or passwords sent to a server?',
    a: 'No. Protection is applied entirely in your browser. Your PDF and passwords never leave your device, are never uploaded, and are not saved after the protected file is created.',
  },
  {
    q: 'Can I remove the protection later?',
    a: 'Yes. Use the Unlock PDF tool on this site. For a file with a password to open, enter that password. A restrict-only file can be unlocked without one, which is another reason restrictions alone are not real security.',
  },
]

export default function ProtectPdfPage() {
  return (
    <ToolLayout tool={tool} howToSteps={HOW_TO_STEPS} faqs={FAQS}>
      <ProtectPdfClient />
    </ToolLayout>
  )
}
