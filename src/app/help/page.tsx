import type { Metadata } from 'next'
import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com'

export const metadata: Metadata = {
  title: 'Help Centre — PDF and Image + FAQ & Support',
  description: 'Find answers to common questions about PDF and Image + tools. Learn about file formats, browser support, file size limits, privacy, and more.',
  keywords: ['pdf tool help', 'pdf and image faq', 'how to merge pdf', 'how to compress image online', 'pdf tool support', 'image converter help'],
  alternates: { canonical: `${SITE_URL}/help` },
  openGraph: {
    title: 'Help Centre — PDF and Image + FAQ & Support',
    description: 'Answers to common questions about our free PDF and image tools.',
    url: `${SITE_URL}/help`,
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Are the tools really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all tools on PDF and Image + are completely free. There are no subscriptions, no hidden fees, and no credits system. The service is supported by display advertising.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do my files get uploaded to your servers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For most tools, no. Processing happens entirely in your browser — your files never leave your device. A small number of tools (PDF to Word, Word to PDF, PDF to Excel, PDF to PowerPoint) require server-side processing. In those cases, your file is sent over HTTPS, processed immediately, and never stored.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a file size limit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Browser-based tools are limited by your device\'s available memory rather than a hard limit we impose. In practice, most files up to 100MB process without issues. Server-side tools have a 50MB limit per file.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which browsers are supported?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'PDF and Image + works on all modern browsers: Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge. We recommend using an up-to-date version for the best experience.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why does a tool say "processing" for a long time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Large files or complex operations (like PDF to image conversion) run entirely on your device, so processing time depends on your hardware. Try refreshing if it seems stuck for more than 2 minutes.',
      },
    },
  ],
}

type FAQ = { q: string; a: string }

const SECTIONS: { heading: string; faqs: FAQ[] }[] = [
  {
    heading: 'General',
    faqs: [
      {
        q: 'Are the tools really free?',
        a: 'Yes, completely free. No subscriptions, no credits, no hidden fees. All tools are supported by non-intrusive display advertising.',
      },
      {
        q: 'Do I need to create an account?',
        a: 'No. You never need to register or log in. Open a tool, process your file, download the result.',
      },
      {
        q: 'Are there watermarks on output files?',
        a: 'Never. We do not add watermarks to any file you download.',
      },
      {
        q: 'Which browsers are supported?',
        a: 'Google Chrome, Mozilla Firefox, Apple Safari, and Microsoft Edge — all modern versions. Mobile browsers are supported too.',
      },
    ],
  },
  {
    heading: 'Privacy & File Security',
    faqs: [
      {
        q: 'Do my files get uploaded to your servers?',
        a: 'For most tools, no — processing happens entirely in your browser. A small number of conversion tools (PDF to Word, Word to PDF, PDF to Excel, PDF to PowerPoint) require server-side processing. In those cases, your file is sent over HTTPS, processed immediately, and never stored or logged.',
      },
      {
        q: 'Can you see the contents of my files?',
        a: 'No. Browser-based tools never send your file anywhere. For server-side tools, your file is handled automatically by software and is never viewed by any person.',
      },
      {
        q: 'How long do you keep my files?',
        a: 'We do not store files. Browser-side tools never leave your device. Server-side tools delete your file from memory immediately after returning the result to you.',
      },
      {
        q: 'Is it safe to process confidential documents?',
        a: 'For browser-based tools, yes — your file never leaves your device. For server-side tools, we recommend avoiding highly sensitive documents unless you are comfortable with HTTPS transmission.',
      },
    ],
  },
  {
    heading: 'PDF Tools',
    faqs: [
      {
        q: 'Is there a file size limit for PDFs?',
        a: 'Browser-based PDF tools are limited by your device\'s memory. Most PDFs up to 100MB work fine. Server-side tools (PDF to Word, etc.) have a 50MB limit.',
      },
      {
        q: 'Why is my merged PDF file larger than the originals combined?',
        a: 'This is normal. PDF merging preserves all embedded fonts, images, and metadata from each original file. Use the Compress PDF tool afterward to reduce the size.',
      },
      {
        q: 'My PDF is password-protected — can I still use the tools?',
        a: 'Most tools cannot process password-protected PDFs. Use the Unlock PDF tool first to remove the password, then process the file.',
      },
      {
        q: 'Why does PDF to Word conversion look different from the original?',
        a: 'PDF to Word conversion is technically complex. Scanned PDFs and PDFs with complex layouts may lose some formatting. Results are best for text-based PDFs created from word processors.',
      },
      {
        q: 'Can I process scanned PDFs?',
        a: 'Yes. Use our OCR PDF tool to extract text from scanned PDFs and make them searchable. Image-based operations (rotate, split, compress) work on all PDFs including scans.',
      },
    ],
  },
  {
    heading: 'Image Tools',
    faqs: [
      {
        q: 'Which image formats are supported?',
        a: 'Most tools support JPG, PNG, WebP, and GIF. Specific tools also support HEIC, SVG, and BMP. Each tool page lists accepted formats.',
      },
      {
        q: 'How much can I compress an image without losing quality?',
        a: 'For JPG and WebP, significant compression (50–80% size reduction) is possible with barely visible quality loss. PNG compression is lossless by default. Use the quality slider to find your balance.',
      },
      {
        q: 'Why can\'t I remove the background from my image?',
        a: 'Background removal works best on photos with clear subject/background contrast. Complex or busy backgrounds may produce imperfect results. Images with transparent backgrounds (PNG) already have no background.',
      },
      {
        q: 'How do I convert an iPhone photo (HEIC) to JPG?',
        a: 'Use our HEIC to JPG tool. Upload your HEIC file and download the converted JPG. No software required.',
      },
    ],
  },
  {
    heading: 'Technical Issues',
    faqs: [
      {
        q: 'A tool is stuck on "processing" — what do I do?',
        a: 'Large files or complex operations can take time depending on your device. Wait up to 2 minutes. If it is still stuck, try refreshing the page and uploading the file again. Make sure no other heavy programs are running.',
      },
      {
        q: 'The tool says my file type is not supported.',
        a: 'Check the accepted formats listed on the tool page. If your file has an unusual extension, try renaming it to the standard extension (e.g. .jpeg → .jpg) and uploading again.',
      },
      {
        q: 'The download button does nothing.',
        a: 'Your browser may be blocking the download. Check that pop-ups and downloads are allowed for pdfandimage.com in your browser settings.',
      },
      {
        q: 'The output file is corrupted or won\'t open.',
        a: 'This can happen with very large files or if processing was interrupted. Try again with a smaller file, or try a different browser. If the issue persists, contact us.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main>
        {/* Hero */}
        <section className="bg-brand-900 text-white py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Help Centre</h1>
            <p className="text-brand-300 text-lg">
              Answers to the most common questions about PDF and Image + tools.
            </p>
          </div>
        </section>

        {/* Quick links */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap gap-2 justify-center">
            {SECTIONS.map(s => (
              <a
                key={s.heading}
                href={`#${s.heading.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-medium rounded-full transition-colors"
              >
                {s.heading}
              </a>
            ))}
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-14">
          {SECTIONS.map(section => (
            <section
              key={section.heading}
              id={section.heading.toLowerCase().replace(/\s+/g, '-')}
              className="mb-12 scroll-mt-24"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">
                {section.heading}
              </h2>
              <div className="space-y-4">
                {section.faqs.map(faq => (
                  <details
                    key={faq.q}
                    className="group border border-gray-100 rounded-xl bg-white overflow-hidden"
                  >
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-medium text-gray-900 text-sm list-none select-none hover:bg-gray-50 transition-colors">
                      {faq.q}
                      <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold group-open:rotate-45 transition-transform duration-200">+</span>
                    </summary>
                    <div className="px-5 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          {/* Still stuck */}
          <div className="bg-brand-900 rounded-2xl p-8 text-center">
            <p className="text-white font-bold text-lg mb-2">Still need help?</p>
            <p className="text-brand-300 text-sm mb-5">
              If your question isn&apos;t answered here, send us a message and we&apos;ll get back to you within 24–48 hours.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
