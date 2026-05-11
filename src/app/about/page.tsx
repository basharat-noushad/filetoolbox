import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Zap, Globe, Lock, Heart, Users } from 'lucide-react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com'

export const metadata: Metadata = {
  title: 'About PDF and Image + — Free Browser-Based PDF & Image Tools',
  description: 'Learn about PDF and Image +, the free online toolkit for PDF and image processing. No sign-up, no file uploads, 100% private and browser-based.',
  keywords: ['about pdf and image', 'free pdf tools online', 'browser based pdf editor', 'private image tools', 'no upload pdf tool'],
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About PDF and Image + — Free Browser-Based PDF & Image Tools',
    description: 'Learn about PDF and Image +, the free online toolkit for PDF and image processing. No sign-up, no file uploads, 100% private.',
    url: `${SITE_URL}/about`,
  },
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PDF and Image +',
  url: SITE_URL,
  description: 'Free online PDF and image processing tools. All tools run in your browser — no file uploads, no registration, no limits.',
  foundingDate: '2024',
  knowsAbout: ['PDF processing', 'Image editing', 'File conversion', 'Browser-based tools'],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'All tools free forever',
  },
}

const VALUES = [
  {
    Icon: Lock,
    title: 'Privacy First',
    body: 'Every tool runs entirely in your browser. Your files never touch our servers. We cannot see, store, or share your documents or images — because we never receive them.',
  },
  {
    Icon: Zap,
    title: 'No Sign-Up Ever',
    body: 'No accounts, no email required, no credit cards. Open any tool, process your file, download the result. That\'s it. We believe useful tools should have zero friction.',
  },
  {
    Icon: Globe,
    title: 'Works Everywhere',
    body: 'PDF and Image + works on any modern browser — Chrome, Firefox, Safari, Edge — on desktop, tablet, or mobile. No software to install, no plugins required.',
  },
  {
    Icon: Heart,
    title: 'Free Forever',
    body: 'Our tools are free for personal and commercial use. We sustain the project through non-intrusive display advertising. No paywalls, no usage limits, no watermarks.',
  },
  {
    Icon: Shield,
    title: 'No Watermarks',
    body: 'Watermarks on free tools are a dark pattern. Every file you download is clean — exactly what you processed, nothing added. Your output belongs to you.',
  },
  {
    Icon: Users,
    title: 'Built for Everyone',
    body: 'From students compressing a thesis PDF to professionals converting spreadsheets — our tools are designed to be intuitive and instant for any skill level.',
  },
]

const STATS = [
  { value: '50+', label: 'Free tools' },
  { value: '0',   label: 'Files uploaded to servers' },
  { value: '0',   label: 'Accounts required' },
  { value: '100%', label: 'Browser-based processing' },
]

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main>
        {/* Hero */}
        <section className="bg-brand-900 text-white py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
              About PDF and Image +
            </h1>
            <p className="text-lg text-brand-300 leading-relaxed max-w-2xl mx-auto">
              We build free, private, browser-based tools for PDF and image processing.
              No accounts. No uploads. No limits. Just tools that work.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {STATS.map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-bold text-brand-600 mb-1">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            PDF and Image + exists because document and image tools should be free, private, and instant.
            Too many tools force you to create an account, upload sensitive files to unknown servers,
            or pay a subscription just to merge two PDFs.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            We built a suite of 50+ tools that run entirely in your browser using modern Web APIs —
            the PDF processing, image conversion, and file manipulation all happen locally on your device.
            Your files are never transmitted anywhere.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We cover the full spectrum: merge, split, compress, convert, rotate, protect PDFs;
            crop, resize, compress, convert, watermark, and enhance images.
            All free. All private. All instant.
          </p>
        </section>

        {/* Values */}
        <section className="bg-gray-50 py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">What We Stand For</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {VALUES.map(({ Icon, title, body }) => (
                <div key={title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech */}
        <section className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            PDF and Image + is built with Next.js, React, and modern browser APIs.
            PDF operations use <strong>pdf-lib</strong> and <strong>PDF.js</strong> — both run client-side.
            Image operations use the Canvas API and <strong>browser-image-compression</strong>.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            A small number of tools that require server-side processing (such as PDF-to-Word conversion)
            use a self-hosted <strong>Gotenberg</strong> instance. In those cases, your file is processed
            immediately and never stored — it is deleted from memory as soon as the converted file is returned.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We use Google Analytics and Ahrefs Web Analytics to understand aggregate usage patterns.
            No personally identifiable information is collected. See our{' '}
            <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link> for details.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-brand-900 py-14 px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Start using PDF and Image + today</h2>
          <p className="text-brand-300 mb-6 text-sm">No account. No credit card. Pick a tool and go.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Browse All Tools
          </Link>
        </section>
      </main>
    </>
  )
}
