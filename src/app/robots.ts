import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com'
  const isNonProductionVercel = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production'

  if (isNonProductionVercel) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${siteUrl}/sitemap.xml` }
}
