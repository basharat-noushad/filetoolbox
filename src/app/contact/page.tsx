import type { Metadata } from 'next'
import { Mail, MessageSquare, Clock, HelpCircle } from 'lucide-react'
import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com'

export const metadata: Metadata = {
  title: 'Contact PDF and Image + — Get Support & Send Feedback',
  description: 'Get in touch with the PDF and Image + team. Report a bug, request a feature, or ask a question. We typically respond within 24–48 hours.',
  keywords: ['contact pdf and image', 'pdf tool support', 'report bug pdf tool', 'feature request', 'pdf image tool help'],
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: 'Contact PDF and Image + — Get Support & Send Feedback',
    description: 'Get in touch with the PDF and Image + team. Report bugs, request features, or ask a question.',
    url: `${SITE_URL}/contact`,
  },
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact PDF and Image +',
  url: `${SITE_URL}/contact`,
  description: 'Contact page for PDF and Image + — free online PDF and image tools.',
}

const CHANNELS = [
  {
    Icon: Mail,
    title: 'Email Support',
    body: 'Send us an email for bug reports, feature requests, or general enquiries.',
    action: 'support@pdfandimage.com',
    href: 'mailto:support@pdfandimage.com',
    label: 'Send an email',
  },
  {
    Icon: Clock,
    title: 'Response Time',
    body: 'We aim to respond to all messages within 24–48 hours on business days.',
    action: null,
    href: null,
    label: null,
  },
  {
    Icon: HelpCircle,
    title: 'Help Centre',
    body: 'Browse answers to the most common questions about our tools before writing in.',
    action: 'Visit Help Centre',
    href: '/help',
    label: 'Visit Help Centre',
  },
]

const TOPICS = [
  { label: 'Bug report', desc: 'A tool isn\'t working correctly' },
  { label: 'Feature request', desc: 'Suggest a new tool or improvement' },
  { label: 'General question', desc: 'Ask anything about the site' },
  { label: 'Privacy concern', desc: 'Questions about data handling' },
  { label: 'Business enquiry', desc: 'Partnerships and integrations' },
]

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main>
        {/* Hero */}
        <section className="bg-brand-900 text-white py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-brand-300 text-lg">
              Have a question, found a bug, or want to suggest a feature?
              We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Left — channels */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <div className="space-y-5">
                {CHANNELS.map(({ Icon, title, body, href, label }) => (
                  <div key={title} className="flex gap-4 p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">{title}</p>
                      <p className="text-sm text-gray-500 leading-relaxed mb-2">{body}</p>
                      {href && label && (
                        <a href={href} className="text-sm text-brand-600 font-medium hover:underline">
                          {label} →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800">Before you write in</p>
                </div>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  Check our <Link href="/help" className="font-medium underline">Help Centre</Link> — most common
                  questions about file formats, browser compatibility, and tool limitations are already answered there.
                </p>
              </div>
            </div>

            {/* Right — topics + email CTA */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">What Can We Help With?</h2>
              <div className="space-y-3 mb-8">
                {TOPICS.map(t => (
                  <div key={t.label} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-brand-900 rounded-xl text-center">
                <Mail className="w-8 h-8 text-brand-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">Email us directly</p>
                <p className="text-brand-300 text-sm mb-4">We read every message and reply personally.</p>
                <a
                  href="mailto:support@pdfandimage.com"
                  className="inline-block bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                  support@pdfandimage.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
