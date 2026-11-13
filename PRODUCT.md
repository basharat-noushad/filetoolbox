# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General public, any skill level — anyone with a one-off PDF or image task (merge, compress, convert, crop, sign, remove a background, etc.), from students to professionals. No technical skill assumed; the product is explicitly "built for everyone."

## Product Purpose

A free, private, browser-based toolkit for PDF and image processing. 50+ single-purpose tools let a visitor solve one specific file task instantly, without installing software, creating an account, or uploading sensitive files to a server.

## Positioning

Unlike ILovePDF, Smallpdf, Adobe Acrobat Online, TinyWow, PDF24, Sejda, PDF2Go, Remove.bg, Canva Background Remover, Squoosh, and TinyPNG, most tools run entirely client-side — files never leave the visitor's device — with no registration, no watermarks, no file-size caps, and no daily-use limits. Free forever, sustained by non-intrusive display advertising rather than subscriptions or paywalled tiers.

## Operating Context

Visitors mostly arrive from search for a specific task-shaped query ("merge pdf", "compress pdf", "remove background from image") and land directly on a dedicated tool page — not the homepage. The task is usually completed in one sitting, often on mobile. Content marketing runs through a blog (22 published guides as of this writing, `src/lib/blogPosts.ts`) and `llms.txt` / `llms-full.txt`, both written for AI-assistant citation as well as human search.

## Capabilities and Constraints

- Most PDF/image operations run fully client-side: `pdf-lib`, `pdfjs-dist`, Canvas API, `browser-image-compression`, `ffmpeg.wasm` (GIF/video tools), `tesseract.js` (OCR).
- A minority of heavier conversions (PDF↔Word, PDF↔Excel, PDF↔PowerPoint) proxy to a self-hosted Stirling PDF instance; the file is processed and deleted immediately, never stored server-side.
- Monetization is Google AdSense display ads only. No accounts, auth, or payment system exists or is planned.
- ~50 live tools across PDF and Image categories (see `src/lib/toolsRegistry.ts`); each tool is its own route/landing page.

## Brand Commitments

- Current, live brand: **PDF and Image +**, domain `pdfandimage.com`. (Note: an earlier project spec, `CLAUDE.md`, names a different brand, "FileToolBox" — confirmed stale/superseded by the live site; do not resurrect it without the user re-raising it.)
- Font: Plus Jakarta Sans.
- Stated values (About page): Privacy First, No Sign-Up Ever, Works Everywhere, Free Forever, No Watermarks, Built for Everyone. Watermarks on free tools are explicitly called out as "a dark pattern" — never add one.

## Evidence on Hand

- About page (`src/app/about/page.tsx`): mission statement, stated values, stats bar (50+ tools, 0 files uploaded, 0 accounts required, 100% browser-based processing).
- 22 published blog guides targeting long-tail SEO keywords (`src/lib/blogPosts.ts`).
- `llms.txt` / `llms-full.txt`: structured site facts for AI citation, including the competitor-alternative list above.
- No testimonials, case studies, press mentions, or usage-benchmark numbers exist anywhere in the codebase — future work must not invent any.

## Product Principles

1. Every tool works with zero server upload wherever technically possible — privacy is the product, not a footnote.
2. Zero friction: no accounts, no email gates, no payment walls, no artificial per-day limits.
3. No watermarks or other dark patterns on any free output, ever.
4. SEO-first: every tool page and every blog post targets one specific, real search query and stands alone as a landing page.
5. Sustained by non-intrusive display advertising only — ad placement never degrades the core tool experience.
