import { MetadataRoute } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Standard search engine crawlers ──────────────────────────────────
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── Google — allow everything including AI Overviews ─────────────────
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── Bing — allow AI features (Copilot sources) ───────────────────────
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── Perplexity AI crawler — GEO: allow full indexing ─────────────────
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── OpenAI / ChatGPT crawler — AIO ───────────────────────────────────
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── OpenAI SearchGPT ─────────────────────────────────────────────────
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── Anthropic Claude crawler — AIO ───────────────────────────────────
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── Google Extended (Gemini / Vertex AI training) ────────────────────
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── Apple Applebot (Siri / Apple Intelligence) ───────────────────────
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── Meta AI crawler ──────────────────────────────────────────────────
      {
        userAgent: 'FacebookBot',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── Amazon Alexa ─────────────────────────────────────────────────────
      {
        userAgent: 'Amazonbot',
        allow: '/',
        disallow: ['/api/'],
      },

      // ── Cohere AI ────────────────────────────────────────────────────────
      {
        userAgent: 'cohere-ai',
        allow: '/',
        disallow: ['/api/'],
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
