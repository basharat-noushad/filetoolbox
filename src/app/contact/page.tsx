import { withSocialMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { Mail, MessageSquare, Clock, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { ContactForm } from './ContactForm'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com'

export const metadata: Metadata = withSocialMetadata({
  title: { absolute: 'Contact PDF and Image + — Get Support & Send Feedback' },
  description: 'Get in touch with the PDF and Image + team. Report a bug, request a feature, or ask a question. Send a message and we usually reply within 1–2 business days.',
  keywords: ['contact pdf and image', 'pdf tool support', 'report bug pdf tool', 'feature request', 'pdf image tool help'],
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: 'Contact PDF and Image + — Get Support & Send Feedback',
    description: 'Get in touch with the PDF and Image + team. Report bugs, request features, or ask a question.',
    url: `${SITE_URL}/contact`,
  },
}, '/contact')

const schema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact PDF and Image +',
  url: `${SITE_URL}/contact`,
  description: 'Contact page for PDF and Image + — free online PDF and image tools.',
}

const CHANNELS = [
  {
    Icon: Clock,
    title: 'Response Time',
    body: 'A real person reads every message. We usually reply within 1–2 business days; bug reports with steps to reproduce get fixed fastest.',
    href: null,
    label: null,
  },
  {
    Icon: Mail,
    title: 'Prefer Email?',
    body: 'You can also write to us directly at contact@pdfandimage.com.',
    href: 'mailto:contact@pdfandimage.com',
    label: 'Send an email',
  },
  {
    Icon: HelpCircle,
    title: 'Help Centre',
    body: 'Browse answers to the most common questions about our tools before writing in.',
    href: '/help',
    label: 'Visit Help Centre',
  },
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

            {/* Right — contact form (first on mobile) */}
            <div className="order-first lg:order-none">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Send Us a Message</h2>
              <p className="text-sm text-gray-500 mb-6">
                Bug report, tool idea, privacy question or business enquiry — pick a topic and we&apos;ll get back to you by email.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
