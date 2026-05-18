import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
})

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')
const ORG_NAME  = 'PDF and Image +'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | PDF and Image +',
    default: 'PDF and Image + — Free PDF & Image Tools Online',
  },
  description: 'Free online PDF and image tools. Merge, compress, convert, crop, resize and more — no sign-up, no watermarks, 100% private. Files never leave your browser.',
  keywords: [
    'pdf tools online free', 'image tools online free',
    'merge pdf', 'compress pdf', 'pdf to word', 'pdf converter',
    'crop image', 'resize image', 'compress image', 'remove background',
    'heic to jpg', 'png to jpg', 'free online tools no registration',
  ],
  authors: [{ name: ORG_NAME, url: SITE_URL }],
  creator: ORG_NAME,
  publisher: ORG_NAME,

  // ── Robots ────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,          // allow full snippets — critical for AI Overviews
      'max-video-preview': -1,
    },
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: ORG_NAME,
    title: `${ORG_NAME} — Free PDF & Image Tools Online`,
    description: 'Free online PDF and image tools. No sign-up, no watermarks, 100% private. Files processed in your browser.',
    url: SITE_URL,
    images: [{
      url: `${SITE_URL}/og-image.png`,
      width: 1200,
      height: 630,
      alt: `${ORG_NAME} — Free PDF & Image Tools`,
    }],
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: `${ORG_NAME} — Free PDF & Image Tools Online`,
    description: 'Free online PDF and image tools. No sign-up, no watermarks, 100% private.',
    images: [`${SITE_URL}/og-image.png`],
  },

  // ── Canonical ─────────────────────────────────────────────────────────────
  alternates: { canonical: SITE_URL },

  // ── App links (GEO/AIO: signals this is a real web app, not spam) ─────────
  applicationName: ORG_NAME,
  category: 'productivity',
}

// ── WebSite schema — enables Google Sitelinks Searchbox ──────────────────────
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: ORG_NAME,
  url: SITE_URL,
  description: 'Free online PDF and image tools. 50+ tools — no sign-up, no file uploads, no watermarks.',
  inLanguage: 'en',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

// ── Organization schema — E-E-A-T + AIO entity recognition ───────────────────
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: ORG_NAME,
  alternateName: ['PDF and Image Plus', 'pdfandimage.com', 'PDF Image Tools'],
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.svg`,
    width: 200,
    height: 60,
    caption: `${ORG_NAME} logo`,
  },
  description: 'PDF and Image + provides 50+ free browser-based tools for PDF and image processing. All tools run in your browser — no file uploads, no registration required.',
  foundingDate: '2024',
  areaServed: 'Worldwide',
  knowsAbout: [
    'PDF processing', 'Image editing', 'File format conversion',
    'PDF compression', 'Image compression', 'Background removal',
    'OCR technology', 'Browser-based computing',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Free PDF and Image Tools',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Merge PDF', url: `${SITE_URL}/merge-pdf` } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Compress PDF', url: `${SITE_URL}/compress-pdf` } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'PDF to Word', url: `${SITE_URL}/pdf-to-word` } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Compress Image', url: `${SITE_URL}/compress-image` } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'Remove Background', url: `${SITE_URL}/remove-background` } },
      { '@type': 'Offer', itemOffered: { '@type': 'SoftwareApplication', name: 'HEIC to JPG', url: `${SITE_URL}/heic-to-jpg` } },
    ],
  },
  sameAs: [
    // Add your social media URLs here when created:
    // 'https://twitter.com/pdfandimage',
    // 'https://www.facebook.com/pdfandimage',
    // 'https://www.linkedin.com/company/pdfandimage',
    // 'https://github.com/pdfandimage',
    // 'https://www.producthunt.com/products/pdf-and-image',
    `${SITE_URL}/about`,
  ],
}

// ── Speakable — Google Assistant / voice search ───────────────────────────────
const speakableSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${SITE_URL}/#webpage`,
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', '.site-description', '[data-speakable]'],
  },
  url: SITE_URL,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID
  const isAdSenseConfigured = publisherId && publisherId !== 'ca-pub-XXXXXXXXXXXXXXXXX'

  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        {/* ── Structured data: Website + Organization + Speakable ────────────── */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }} />

        {/* ── Analytics ──────────────────────────────────────────────────────── */}
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="RX6OShW8isolrP6Ut1Gq1w" async />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-7K0BQW61Y2" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-7K0BQW61Y2');
        `}</Script>
        <Script id="clarity-init" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wshedhqx40");
        `}</Script>

        {/* ── AdSense ────────────────────────────────────────────────────────── */}
        {isAdSenseConfigured && (
          <Script async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous" strategy="afterInteractive"
          />
        )}
      </head>
      <body className="antialiased">
        <Header />
        {children}
        <Footer />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
