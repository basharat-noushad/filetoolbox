import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import Script from 'next/script'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://filetoolbox.com'),
  title: { template: '%s | FileToolBox', default: 'FileToolBox — Free PDF & Image Tools Online' },
  description: 'Free online tools for PDF and images. Merge, compress, convert, crop, resize and more. No registration required. Secure and private.',
  keywords: ['pdf tools', 'image tools', 'merge pdf', 'compress pdf', 'crop image', 'resize image', 'convert image', 'free online tools'],
  authors: [{ name: 'FileToolBox' }],
  creator: 'FileToolBox',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'FileToolBox',
    title: 'FileToolBox — Free PDF & Image Tools Online',
    description: 'Free online tools for PDF and images. Merge, compress, convert, crop, resize and more. No registration required.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'pdf and image + — Free PDF & Image Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FileToolBox — Free PDF & Image Tools Online',
    description: 'Free online tools for PDF and images. No sign-up required.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID
  const isAdSenseConfigured = publisherId && publisherId !== 'ca-pub-XXXXXXXXXXXXXXXXX'

  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
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
      </body>
    </html>
  )
}
