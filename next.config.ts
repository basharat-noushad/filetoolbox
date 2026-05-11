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
    const baseHeaders = [
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
    ]
    if (isNonProductionVercel) {
      baseHeaders.push({ key: 'X-Robots-Tag', value: 'noindex, nofollow' })
    }
    return [{ source: '/(.*)', headers: baseHeaders }]
  },
}

export default nextConfig
