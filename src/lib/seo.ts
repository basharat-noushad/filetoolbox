import type { Metadata } from 'next'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')

// Next replaces nested metadata objects rather than merging their fields.
export function withSocialMetadata(metadata: Metadata, path: string): Metadata {
  const title = typeof metadata.title === 'string' ? metadata.title : undefined
  const images = [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'PDF and Image + — free PDF and image tools' }]
  return {
    ...metadata,
    openGraph: {
      type: 'website', siteName: 'PDF and Image +', locale: 'en_US',
      title, description: metadata.description || undefined,
      ...metadata.openGraph,
      url: `${SITE_URL}${path === '/' ? '' : path}`,
      images: metadata.openGraph?.images || images,
    },
    twitter: {
      card: 'summary_large_image', title, description: metadata.description || undefined,
      ...metadata.twitter,
      images: metadata.twitter?.images || images,
    },
  }
}

// These tools send the selected file to an API; all other current tools run locally.
const SERVER_TOOLS = new Set([
  'pdf-to-word', 'word-to-pdf', 'pdf-to-excel', 'excel-to-pdf', 'ppt-to-pdf',
  'pdf-to-ppt', 'remove-background',
])

export function usesProcessingServer(slug: string) {
  return SERVER_TOOLS.has(slug)
}
