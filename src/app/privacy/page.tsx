import type { Metadata } from 'next'
import Link from 'next/link'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')
const LAST_UPDATED = '2025-01-01'
const LAST_UPDATED_DISPLAY = 'January 1, 2025'

export const metadata: Metadata = {
  title: 'Privacy Policy — PDF and Image +',
  description: 'PDF and Image + privacy policy. Your files never leave your browser. We collect no personal information. Full details on data handling and analytics.',
  keywords: ['pdf tool privacy policy', 'no data collection pdf tool', 'browser based private pdf', 'image tool privacy'],
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: {
    title: 'Privacy Policy — PDF and Image +',
    description: 'Your files never leave your browser. PDF and Image + collects no personal information. Full privacy policy.',
    url: `${SITE_URL}/privacy`,
  },
}

// E-E-A-T: privacy policy schema signals to Google this is a legitimate, trustworthy site
const privacySchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${SITE_URL}/privacy`,
  url: `${SITE_URL}/privacy`,
  name: 'Privacy Policy — PDF and Image +',
  description: 'Privacy policy for pdfandimage.com. Files are processed locally in the browser. No personal data collected.',
  datePublished: '2025-01-01',
  dateModified: LAST_UPDATED,
  isPartOf: { '@type': 'WebSite', name: 'PDF and Image +', url: SITE_URL },
  about: {
    '@type': 'Organization',
    name: 'PDF and Image +',
    url: SITE_URL,
  },
  publisher: {
    '@type': 'Organization',
    name: 'PDF and Image +',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` },
  },
  inLanguage: 'en',
}

const sections = [
  {
    id: 'overview',
    heading: '1. Overview',
    content: `PDF and Image + ("we", "our", "the site") is a free online tool suite for PDF and image processing available at pdfandimage.com. We are committed to protecting your privacy. This policy explains what information we collect, how we use it, and what we never do with your data.

The short version: your files never leave your device. We do not collect, store, or process any of the documents or images you work with on this site.`,
  },
  {
    id: 'files',
    heading: '2. Your Files',
    content: `All PDF and image processing on PDF and Image + happens locally in your browser using JavaScript. When you upload a file to a tool, it is loaded into your browser's memory and processed there. No file data is transmitted to our servers.

Exception: a small number of tools that require server-side conversion (such as PDF to Word, Word to PDF, PDF to Excel, and PDF to PowerPoint) send your file to a self-hosted processing server. In these cases:
• Your file is transmitted over an encrypted HTTPS connection.
• It is processed immediately and the result is returned to your browser.
• The file is never stored on disk and is deleted from server memory immediately after conversion.
• No logs of the file content are kept.`,
  },
  {
    id: 'analytics',
    heading: '3. Analytics & Usage Data',
    content: `We use the following analytics services to understand how the site is used in aggregate:

Google Analytics (Google LLC) — We use Google Analytics 4 to collect anonymised usage statistics such as page views, session duration, and geographic region. Google Analytics sets cookies on your browser. IP addresses are anonymised. You can opt out via the Google Analytics Opt-out Browser Add-on.

Ahrefs Web Analytics — We use Ahrefs Web Analytics for privacy-friendly traffic measurement. Ahrefs does not use cookies and does not collect personal data.

Neither service receives any of your file content. All data collected is aggregate and anonymised.`,
  },
  {
    id: 'advertising',
    heading: '4. Advertising',
    content: `PDF and Image + is supported by display advertising provided by Google AdSense. Google may use cookies and similar technologies to show you relevant ads based on your browsing history.

You can manage your ad personalisation settings at g.co/adsettings or opt out of personalised advertising via the NAI opt-out page at optout.networkadvertising.org.`,
  },
  {
    id: 'cookies',
    heading: '5. Cookies',
    content: `We use the following cookies:

Analytics cookies: Set by Google Analytics to track session data (anonymised). These expire after 2 years.
Advertising cookies: Set by Google AdSense to serve and measure ads.
Preference cookies: Small cookies to remember your in-tool settings (e.g. last used compression level). These are first-party session cookies.

You can disable cookies in your browser settings. Disabling analytics and advertising cookies will not affect the functionality of our tools.`,
  },
  {
    id: 'personal-data',
    heading: '6. Personal Data We Collect',
    content: `We do not require you to create an account or provide any personal information to use our tools.

If you contact us via email, we will receive your email address and the contents of your message. This information is used solely to respond to your enquiry and is not shared with third parties.

We do not sell, trade, or rent personal information to third parties under any circumstances.`,
  },
  {
    id: 'third-parties',
    heading: '7. Third-Party Services',
    content: `Our site may embed or link to third-party services. This privacy policy does not cover those services. We recommend reviewing their privacy policies:

• Google Analytics: policies.google.com/privacy
• Google AdSense: policies.google.com/privacy
• Ahrefs: ahrefs.com/privacy`,
  },
  {
    id: 'childrens',
    heading: "8. Children's Privacy",
    content: `PDF and Image + is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.`,
  },
  {
    id: 'changes',
    heading: '9. Changes to This Policy',
    content: `We may update this privacy policy from time to time. We will post the updated version on this page with a revised "Last updated" date. We encourage you to review this page periodically.`,
  },
  {
    id: 'contact',
    heading: '10. Contact',
    content: `If you have any questions about this privacy policy or our data practices, please contact us at support@pdfandimage.com.`,
  },
]

export default function PrivacyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(privacySchema) }} />

      <main>
        <section className="bg-brand-900 text-white py-14 px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Privacy Policy</h1>
            <p className="text-brand-300">Last updated: <time dateTime={LAST_UPDATED}>{LAST_UPDATED_DISPLAY}</time></p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-14 flex flex-col lg:flex-row gap-10">
          <aside className="lg:w-56 shrink-0">
            <div className="sticky top-24">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contents</p>
              <nav aria-label="Privacy policy sections">
                <ul className="space-y-1">
                  {sections.map(s => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="block text-sm text-gray-600 hover:text-brand-600 py-1 transition-colors">
                        {s.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          <article className="flex-1 min-w-0">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-10">
              <p className="text-sm font-semibold text-emerald-800 mb-1">🔒 Key privacy commitment</p>
              <p className="text-sm text-emerald-700 leading-relaxed">
                Your files are processed locally in your browser and never uploaded to our servers
                (with the narrow exception of server-side conversion tools described in Section 2).
                We collect no personal information.
              </p>
            </div>

            <div className="space-y-10">
              {sections.map(s => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{s.heading}</h2>
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{s.content}</div>
                </section>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500">
              Have questions? <Link href="/contact" className="text-brand-600 hover:underline">Contact us</Link>.
            </div>
          </article>
        </div>
      </main>
    </>
  )
}
