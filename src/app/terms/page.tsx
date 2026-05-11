import type { Metadata } from 'next'
import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com'
const LAST_UPDATED = 'January 1, 2025'

export const metadata: Metadata = {
  title: 'Terms of Service — PDF and Image +',
  description: 'Terms of service for PDF and Image +. Read our usage terms, acceptable use policy, and disclaimers for our free PDF and image tools.',
  keywords: ['pdf tool terms of service', 'free pdf tool terms', 'image tool terms', 'pdf and image terms'],
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: 'Terms of Service — PDF and Image +',
    description: 'Terms of service for PDF and Image +. Free online PDF and image tools.',
    url: `${SITE_URL}/terms`,
  },
}

const sections = [
  {
    id: 'acceptance',
    heading: '1. Acceptance of Terms',
    content: `By accessing or using PDF and Image + ("the Site", "we", "our") at pdfandimage.com, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Site.

We reserve the right to update these terms at any time. Continued use of the Site after changes constitutes acceptance of the updated terms.`,
  },
  {
    id: 'description',
    heading: '2. Description of Service',
    content: `PDF and Image + provides free, browser-based tools for processing PDF and image files. Our tools include merging, splitting, compressing, converting, rotating, protecting PDFs, and compressing, resizing, cropping, and converting images.

Most tools operate entirely in your browser. A small number of tools use server-side processing for technical reasons (e.g. PDF to Word conversion). The service is provided free of charge and supported by display advertising.`,
  },
  {
    id: 'use',
    heading: '3. Acceptable Use',
    content: `You may use PDF and Image + for personal and commercial purposes, subject to these terms. You agree not to:

• Upload or process files that contain malware, viruses, or malicious code.
• Use the service to process content that infringes third-party intellectual property rights.
• Attempt to reverse-engineer, scrape, or overload the service through automated means.
• Use the service in any way that violates applicable law or regulation.
• Attempt to circumvent any security measures or rate limits.

We reserve the right to block access for users who violate these terms.`,
  },
  {
    id: 'files',
    heading: '4. Your Files and Content',
    content: `You retain full ownership of any files you process using our tools. We do not claim any rights over your content.

You are solely responsible for ensuring you have the right to process files using our service. Do not use our tools to process files you do not own or have permission to modify.

For tools that involve server-side processing, your file is handled as described in our Privacy Policy. We do not store, review, or retain your file content after processing.`,
  },
  {
    id: 'intellectual-property',
    heading: '5. Intellectual Property',
    content: `The PDF and Image + website, including its design, code, logos, and content, is owned by PDF and Image + and protected by intellectual property laws.

You may not reproduce, distribute, or create derivative works based on the site without our written permission.

Open-source libraries used in this project are subject to their respective licences (MIT, Apache 2.0, etc.).`,
  },
  {
    id: 'disclaimer',
    heading: '6. Disclaimer of Warranties',
    content: `PDF and Image + is provided "as is" and "as available" without any warranty of any kind, express or implied.

We do not warrant that:
• The service will be uninterrupted or error-free.
• Processing results will meet your specific requirements.
• The service will be compatible with every file or browser.

You use the service at your own risk. Always keep backups of important files before processing.`,
  },
  {
    id: 'liability',
    heading: '7. Limitation of Liability',
    content: `To the fullest extent permitted by law, PDF and Image + and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including but not limited to loss of data or files.

Our total liability to you for any claim arising from use of the service shall not exceed USD $0, reflecting that the service is provided free of charge.`,
  },
  {
    id: 'third-party',
    heading: '8. Third-Party Services',
    content: `The Site uses third-party services including Google Analytics, Google AdSense, and Ahrefs Web Analytics. These services are governed by their own terms of service and privacy policies. We are not responsible for the practices of third-party services.

The Site may contain links to third-party websites. We are not responsible for the content or practices of any linked sites.`,
  },
  {
    id: 'termination',
    heading: '9. Termination',
    content: `We reserve the right to suspend or terminate access to the Site at any time, for any reason, without notice. This includes blocking access from specific IP addresses or regions.`,
  },
  {
    id: 'governing-law',
    heading: '10. Governing Law & International Use',
    content: `These terms are governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from or relating to these terms or the use of the Site shall be subject to the jurisdiction of the courts of the United States.

PDF and Image + is a globally accessible service with infrastructure hosted in the United States. If you access the Site from outside the United States, you do so at your own initiative and are responsible for compliance with your local laws to the extent applicable.

Nothing in these terms limits any rights you may have under the mandatory consumer protection or data protection laws of your country of residence. Users in the European Union may have additional rights under the GDPR. Users in the United Kingdom may have rights under the UK GDPR. Users in California may have rights under the CCPA.`,
  },
  {
    id: 'contact',
    heading: '11. Contact',
    content: `For questions about these terms, contact us at support@pdfandimage.com.`,
  },
]

export default function TermsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-brand-900 text-white py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-brand-300">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-14 flex flex-col lg:flex-row gap-10">

        {/* ToC sidebar */}
        <aside className="lg:w-56 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contents</p>
            <nav className="space-y-1">
              {sections.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-gray-600 hover:text-brand-600 py-1 transition-colors"
                >
                  {s.heading}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <article className="flex-1 min-w-0">
          <div className="space-y-10">
            {sections.map(s => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-lg font-bold text-gray-900 mb-3">{s.heading}</h2>
                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{s.content}</div>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500">
            Questions? <Link href="/contact" className="text-brand-600 hover:underline">Contact us</Link>.
            Also read our <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
          </div>
        </article>
      </div>
    </main>
  )
}
