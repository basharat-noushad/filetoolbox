import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

// ── Content-Security-Policy ───────────────────────────────────────────────────
// Trade-off: script-src uses 'unsafe-inline' + a host allowlist, NOT nonces. A per-request nonce needs
// middleware and forces every page to render dynamically (no static generation / CDN caching for the
// 60+ tool pages), which is not worth it for a site with no logins or user-generated HTML. What this policy
// still buys: scripts only from us + the listed analytics/ads hosts, no plugins (object-src), no <base>
// hijack, no off-site form posts, no framing by other sites, and connect-src limits where data can be sent.
// It does NOT stop an injected inline <script> from running; that needs nonces/hashes (see security notes).
// 'wasm-unsafe-eval' lets ffmpeg, qpdf, ghostscript, tesseract and MediaPipe compile WebAssembly without
// allowing JS eval. Dev adds 'unsafe-eval' (React Refresh) and ws: (HMR).
const GOOGLE_ADS = 'https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://*.google.com https://www.googleadservices.com https://*.googletagservices.com https://fundingchoicesmessages.google.com'
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://*.clarity.ms https://analytics.ahrefs.com https://va.vercel-scripts.com ${GOOGLE_ADS}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  // cdn.jsdelivr.net: Tesseract.js downloads non-English OCR language data from its default CDN
  `connect-src 'self' data: blob:${isDev ? ' ws: wss:' : ''} https://cdn.jsdelivr.net https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com https://analytics.ahrefs.com https://vitals.vercel-insights.com ${GOOGLE_ADS}`,
  `frame-src 'self' https://www.googletagmanager.com ${GOOGLE_ADS}`,
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // no preload: www is served by Cloudflare and other subdomains are unaudited; preload is hard to undo
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // clipboard-write: copy buttons (OCR, base64, favicon...). Image-to-text paste uses paste events, not
  // clipboard-read. Ad-related Privacy Sandbox features are left at browser defaults for AdSense.
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), display-capture=(), clipboard-read=(), clipboard-write=(self)' },
]

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
      // AI models, wasm runtimes and fonts: large and only change with a deploy that renames or updates them.
      cache('/models/:path*', 'public, max-age=2592000'),
      cache('/ort/:path*', 'public, max-age=2592000'),
      cache('/mediapipe/:path*', 'public, max-age=2592000'),
      cache('/fonts/:path*', 'public, max-age=2592000'),
    ]
    const robots = isNonProductionVercel ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []
    return [{ source: '/(.*)', headers: [...securityHeaders, ...robots] }, ...docConvert]
  },
}

export default nextConfig
