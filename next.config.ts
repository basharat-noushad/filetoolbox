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
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
}

export default nextConfig
