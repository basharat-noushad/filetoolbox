import { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Standard search engine crawlers ──────────────────────────────────
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },

      // ── Google — allow everything including AI Overviews ─────────────────
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },

      // ── Bing — allow AI features (Copilot sources) ───────────────────────
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },

      // ── Perplexity AI crawler — GEO: allow full indexing ─────────────────
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },

      // ── OpenAI / ChatGPT crawler — AIO ───────────────────────────────────
      {
        userAgent: 'GPTBot',
        allow: '/',
      },

      // ── OpenAI SearchGPT ─────────────────────────────────────────────────
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
      },

      // ── Anthropic Claude crawler — AIO ───────────────────────────────────
      {
        userAgent: 'anthropic-ai',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },

      // ── Google Extended (Gemini / Vertex AI training) ────────────────────
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },

      // ── Apple Applebot (Siri / Apple Intelligence) ───────────────────────
      {
        userAgent: 'Applebot',
        allow: '/',
      },

      // ── Meta AI crawler ──────────────────────────────────────────────────
      {
        userAgent: 'FacebookBot',
        allow: '/',
      },

      // ── Amazon Alexa ─────────────────────────────────────────────────────
      {
        userAgent: 'Amazonbot',
        allow: '/',
      },

      // ── Cohere AI ────────────────────────────────────────────────────────
      {
        userAgent: 'cohere-ai',
        allow: '/',
      },

      // ── Common SEO bots — explicit allow ─────────────────────────────────
      {
        userAgent: 'AhrefsBot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'SemrushBot',
        allow: '/',
        disallow: ['/api/'],
      },
    ],

    // Sitemaps — both sitemap and llms files advertised here
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
    ],

    // Host declaration — helps some crawlers with canonicalization
    host: SITE_URL,
  }
}
