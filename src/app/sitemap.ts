import { MetadataRoute } from 'next'
import { tools } from '@/lib/toolsRegistry'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://filetoolbox.com'
  const now = new Date()
  return [
    { url: siteUrl, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    ...tools.map(tool => ({
      url: `${siteUrl}/${tool.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: tool.tier === 1 ? 0.9 : 0.7,
    })),
  ]
}
