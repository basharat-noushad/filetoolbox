import { MetadataRoute } from 'next'
import { tools } from '@/lib/toolsRegistry'
import { BLOG_POSTS } from '@/lib/blogPosts'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')
  // Omit lastModified unless we have an actual content revision date.
  // A deploy or request does not mean every page's content has changed.

  const staticPages = [
    { slug: 'about',   changeFrequency: 'monthly'  as const, priority: 0.6 },
    { slug: 'blog',    changeFrequency: 'weekly'   as const, priority: 0.7 },
    { slug: 'help',    changeFrequency: 'monthly'  as const, priority: 0.6 },
    { slug: 'contact', changeFrequency: 'yearly'   as const, priority: 0.4 },
    { slug: 'privacy', changeFrequency: 'yearly'   as const, priority: 0.3 },
    { slug: 'terms',   changeFrequency: 'yearly'   as const, priority: 0.3 },
  ]

  return [
    // Homepage
    { url: siteUrl, changeFrequency: 'weekly', priority: 1.0 },

    // Static pages
    ...staticPages.map(p => ({
      url: `${siteUrl}/${p.slug}`,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),

    // All tool pages
    ...tools.map(tool => ({
      url: `${siteUrl}/${tool.slug}`,
      changeFrequency: 'monthly' as const,
      priority: tool.tier === 1 ? 0.9 : 0.7,
    })),

    // All blog posts — now included with real datePublished dates
    ...BLOG_POSTS.map(post => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.dateModified),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
