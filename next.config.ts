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
    if (!isNonProductionVercel) return []
    return [{ source: '/(.*)', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
  },
}

export default nextConfig
