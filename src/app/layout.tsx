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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { template: '%s | PDF and Image +', default: 'PDF and Image + — Free PDF & Image Tools Online' },
  description: 'Free online PDF and image tools. Merge, compress, convert, crop, resize and more — no sign-up, no watermarks, 100% private.',
  keywords: ['pdf tools online', 'image tools', 'merge pdf', 'compress pdf', 'pdf to word', 'pdf converter', 'crop image', 'resize image', 'free online tools'],
  authors: [{ name: 'PDF and Image +', url: SITE_URL }],
  creator: 'PDF and Image +',
  publisher: 'PDF and Image +',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'PDF and Image +',
    title: 'PDF and Image + — Free PDF & Image Tools Online',
    description: 'Free online PDF and image tools. No sign-up, no watermarks, 100% private.',
    url: SITE_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'PDF and Image + — Free PDF & Image Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF and Image + — Free PDF & Image Tools Online',
    description: 'Free online PDF and image tools. No sign-up, no watermarks, 100% private.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: SITE_URL },
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'PDF and Image +',
  url: SITE_URL,
  description: 'Free online PDF and image tools. No sign-up required.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PDF and Image +',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  sameAs: [],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID
  const isAdSenseConfigured = publisherId && publisherId !== 'ca-pub-XXXXXXXXXXXXXXXXX'

  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
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
