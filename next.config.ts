import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false
    config.resolve.fallback = { ...config.resolve.fallback, fs: false }
    return config
  },
  turbopack: {
    resolveAlias: {
      canvas: { browser: './src/lib/empty.ts' },
    },
  },
  async headers() {
    const isNonProductionVercel = process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production'
    // No COOP/COEP: cross-origin isolation blocked analytics and AdSense, and the
    // single-thread ffmpeg core used by gif/mp4 tools doesn't need SharedArrayBuffer.
    // In-browser document converter (public/doc-convert): chunk names carry a content hash, so they can
    // be cached forever; fonts and pdf.js data files only change with a dependency update.
    const cache = (source: string, value: string) => ({ source, headers: [{ key: 'Cache-Control', value }] })
    const docConvert = [
      cache('/doc-convert/chunks/:path*', 'public, max-age=31536000, immutable'),
      cache('/doc-convert/fonts/:path*', 'public, max-age=2592000'),
      cache('/doc-convert/pdfjs/:path*', 'public, max-age=2592000'),
    ]
    if (!isNonProductionVercel) return docConvert
    return [{ source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }, ...docConvert]
  },
}

export default nextConfig
