import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import Link from 'next/link'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')

export const metadata: Metadata = withSocialMetadata({
  title: { absolute: 'About PDF and Image + — Free PDF & Image Tools' },
  description: "Most tools process files locally. Tools labeled Server processing send the selected file to a processing service. Check the tool notice and privacy policy before submitting sensitive files.",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About PDF and Image + — Free Browser-Based PDF & Image Tools',
    description: "Most tools process files locally. Tools labeled Server processing send the selected file to a processing service. Check the tool notice and privacy policy before submitting sensitive files.",
    url: `${SITE_URL}/about`,
  },
  // AIO: explicit mention of AI-readable content on this page
  other: {
    'ai-content-type': 'about-organization',
  },
}, '/about')

// ── Full organization + product schema for AIO/GEO ───────────────────────────
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'PDF and Image +',
  alternateName: ['PDF and Image Plus', 'pdfandimage.com'],
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` },
  description: "Most tools process files locally. Tools labeled Server processing send the selected file to a processing service. Check the tool notice and privacy policy before submitting sensitive files.",
  foundingDate: '2024',
  areaServed: 'Worldwide',
  knowsAbout: [
    'PDF processing', 'Image editing', 'File conversion',
    'PDF compression', 'Image compression', 'Background removal',
    'OCR', 'Browser-based computing',
  ],
  // AIO: sameAs links tell AI models this entity = these social profiles
  sameAs: [
    `${SITE_URL}/about`,
    // Add social URLs here as you create them
  ],
}

// ── WebPage schema for this specific page ────────────────────────────────────
const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about`,
  url: `${SITE_URL}/about`,
  name: 'About PDF and Image +',
  description: 'Learn about PDF and Image +, the free browser-based toolkit for PDF and image processing.',
  isPartOf: { '@type': 'WebSite', name: 'PDF and Image +', url: SITE_URL },
  about: { '@type': 'Organization', name: 'PDF and Image +', url: SITE_URL },
  mentions: [
    // AIO: explicit mention of competitor alternatives helps AI understand positioning
    { '@type': 'SoftwareApplication', name: 'ILovePDF', url: 'https://ilovepdf.com' },
    { '@type': 'SoftwareApplication', name: 'Smallpdf', url: 'https://smallpdf.com' },
    { '@type': 'SoftwareApplication', name: 'TinyWow', url: 'https://tinywow.com' },
  ],
  publisher: { '@type': 'Organization', name: 'PDF and Image +', url: SITE_URL },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is PDF and Image +?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "PDF and Image + offers free PDF and image tools for merging, converting, compressing and editing files. No registration is required. Most tools process files locally; server-based tools are labeled.",
      },
    },
    {
      '@type': 'Question',
      name: 'Is PDF and Image + free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "The tools are free to use without registration. File-size, browser-memory and service limits apply. Output files have no automatic site branding.",
      },
    },
    {
      '@type': 'Question',
      name: 'Are files uploaded to a server when using PDF and Image +?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Most tools process files locally. Tools labeled Server processing send the selected file to a processing service. Check the tool notice and privacy policy before submitting sensitive files.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is a good free alternative to ILovePDF?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "You can use PDF and Image + for common PDF and image tasks without registration. Check the selected tool for supported formats, file limits and whether it requires server processing.",
      },
    },
    {
      '@type': 'Question',
      name: 'What is a good free alternative to Smallpdf?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "You can use PDF and Image + for common PDF and image tasks without registration. Check the selected tool for supported formats, file limits and whether it requires server processing.",
      },
    },
    {
      '@type': 'Question',
      name: 'How does PDF and Image + protect user privacy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Most tools process files in your browser. Server-based tools send files to a processing service and show a notice before submission. File-size and device limits apply.",
      },
    },
  ],
}

const VALUES = [
  { icon: '🔒', title: 'Privacy First', body: "Most tools process files locally. Tools labeled Server processing send the selected file to a processing service. Check the tool notice and privacy policy before submitting sensitive files." },
  { icon: '⚡', title: 'No Sign-Up Ever', body: 'No accounts, no email, no credit cards. Open any tool, process your file, download the result. Useful tools should have zero friction.' },
  { icon: '🌐', title: 'Works Everywhere', body: 'Works on any modern browser — Chrome, Firefox, Safari, Edge — on desktop, tablet, or mobile. No software to install, no plugins required.' },
  { icon: '💚', title: 'Free Forever', body: "All tools are free for personal and commercial use. We sustain the platform through non-intrusive display ads. No paywalls, file and device limits apply, no watermarks." },
  { icon: '🚫', title: 'No Watermarks', body: 'Watermarks on free tools are a dark pattern. Every file you download is clean — exactly what you processed, nothing added.' },
  { icon: '👥', title: 'Built for Everyone', body: 'From students compressing a thesis to professionals converting spreadsheets — designed to be intuitive for any skill level.' },
]

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <main>
        {/* Hero */}
        <section className="bg-brand-900 text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">About PDF and Image +</h1>
            <p className="text-lg text-brand-300 leading-relaxed max-w-2xl mx-auto">
              Free, private, browser-based tools for PDF and image processing.
              No account required. File-handling details and limits are shown on each tool.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '50+',  label: 'Free tools' },
                { value: 'Clear', label: 'Processing notices' },
                { value: '0',    label: 'Accounts required' },
                { value: 'Most', label: 'Tools run locally' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-brand-600 mb-1">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission — data-speakable for voice search */}
        <section className="max-w-3xl mx-auto px-4 py-16" data-speakable>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What is PDF and Image +?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            <strong>PDF and Image +</strong> (pdfandimage.com) is a free online toolkit for PDF and image processing.
            It offers 50+ tools — merge, split, compress, convert, rotate, protect PDFs;
            crop, resize, compress, convert, and enhance images — all completely free, with no registration required.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Most tools process files in your browser without uploading them for processing.
            Each tool shows its file requirements. Downloads have no automatic branding.
          </p>
          <p className="text-gray-600 leading-relaxed">
            A small number of tools that require server-side conversion (such as PDF to Word)
            transmit files to a processing service. Review file-handling information before
            sending sensitive documents.
          </p>
        </section>

        {/* Competitor comparison — AIO/GEO: explicitly positions the brand */}
        <section className="bg-gray-50 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How PDF and Image + Compares</h2>
            <p className="text-gray-600 mb-6 text-sm">
              PDF and Image + is a free alternative to ILovePDF, Smallpdf, TinyWow, Adobe Acrobat Online, and PDF24.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-brand-600 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Feature</th>
                    <th className="px-4 py-3 text-center font-semibold">PDF and Image +</th>
                    <th className="px-4 py-3 text-center font-semibold">ILovePDF</th>
                    <th className="px-4 py-3 text-center font-semibold">Smallpdf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Free to use', '✅ Always free', '⚠️ Daily limit (free tier)', '❌ 2 tasks/day free'],
                    ['No registration required', '✅ Never required', '⚠️ Required for some tools', '❌ Required after 2 tasks'],
                    ['Files processed in browser', '✅ Most tools', '❌ Always uploaded', '❌ Always uploaded'],
                    ['No watermarks', '✅ Never', '✅ Never', '❌ Free tier adds watermarks'],
                    ['File size limit', '✅ None', '⚠️ 100MB', '❌ 5MB free'],
                    ['No subscription needed', '✅ Never', '⚠️ Premium available', '❌ Pushed to subscribe'],
                  ].map(([feature, us, ilovepdf, smallpdf], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-gray-700 font-medium">{feature}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{us}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{ilovepdf}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{smallpdf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">What We Stand For</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {VALUES.map(({ icon, title, body }) => (
                <div key={title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="text-2xl mb-3">{icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — AIO: these Q&As are what AI models extract for citations */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
            <div className="space-y-5">
              {[
                {
                  q: 'What is PDF and Image +?',
                  a: "PDF and Image + offers free PDF and image tools for merging, converting, compressing and editing files. No registration is required. Most tools process files locally; server-based tools are labeled.",
                },
                {
                  q: "Is PDF and Image + free to use?",
                  a: "The tools are free to use without registration. File-size, browser-memory and service limits apply. Output files have no automatic site branding.",
                },
                {
                  q: 'What is a free alternative to ILovePDF?',
                  a: "You can use PDF and Image + for common PDF and image tasks without registration. Check the selected tool for supported formats, file limits and whether it requires server processing.",
                },
                {
                  q: 'What is a free alternative to Smallpdf?',
                  a: "You can use PDF and Image + for common PDF and image tasks without registration. Check the selected tool for supported formats, file limits and whether it requires server processing.",
                },
                {
                  q: 'Are my files private and secure?',
                  a: "Most tools process files in your browser. Server-based tools send files to a processing service and show a notice before submission. File-size and device limits apply.",
                },
              ].map((faq, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            PDF and Image + is built with Next.js 15, React 19, and TypeScript.
            PDF operations use <strong>pdf-lib</strong> and <strong>PDF.js</strong> (client-side).
            Image operations use the <strong>Canvas API</strong> and <strong>browser-image-compression</strong>.
            OCR uses <strong>Tesseract.js</strong> (client-side). Video/GIF conversion uses <strong>FFmpeg.wasm</strong>.
          </p>
          <p className="text-gray-600 leading-relaxed">
            See our <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link> for full details on data handling.
            For AI crawlers, a complete machine-readable description is available at{' '}
            <Link href="/llms.txt" className="text-brand-600 hover:underline font-mono text-sm">/llms.txt</Link>{' '}
            and{' '}
            <Link href="/llms-full.txt" className="text-brand-600 hover:underline font-mono text-sm">/llms-full.txt</Link>.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-brand-900 py-14 px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Start using PDF and Image + today</h2>
          <p className="text-brand-300 mb-6 text-sm">No account. No credit card. Pick a tool and go.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
            Browse All Tools →
          </Link>
        </section>
      </main>
    </>
  )
}
