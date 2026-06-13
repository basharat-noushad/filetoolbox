# SEO_FIXES.md — Live Status Board

Last updated: 2025-05-17

---

## ✅ DONE — Applied directly to codebase

### Critical fixes (were blocking Google)
- [x] Removed `robots: { index: false }` from `blog/[slug]/page.tsx` — all 9 posts now indexable
- [x] Replaced "Article Coming Soon" with real content for all 9 blog posts
- [x] Blog posts added to sitemap with real `datePublished` dates

### Content rewrites (SEO quality)
- [x] All 9 posts rewritten with primary keyword in the first 100 words
- [x] All step-by-step sections converted from paragraphs to `steps[]` (renders as `<ol>`)
- [x] All list-style content converted from comma-separated sentences to `bullets[]` (renders as `<ul>`)
- [x] 5 FAQs added to every blog post
- [x] H2 headings updated to include target keywords in posts 1, 3, 7, 8
- [x] Post 3 title fixed: "PDF to Word Conversion: Tips" → "How to Convert PDF to Word Online — Tips for the Best Results"
- [x] Post 7 rewritten for general users (removed developer jargon like "Retina screens", "SEO rankings")
- [x] Posts 2 and 9 expanded significantly (were ~450 words, now 800+)
- [x] Post 4 "Quick Reference" converted from paragraph to bullets list

### Schema improvements
- [x] `FAQPage` schema injected on every blog post (triggers People Also Ask boxes)
- [x] `HowTo` schema injected on posts containing `steps[]` (triggers How-To rich results)
- [x] `Article` schema on all posts with `datePublished` and `dateModified`
- [x] `BreadcrumbList` schema on all posts

### Renderer improvements (`blog/[slug]/page.tsx`)
- [x] `steps[]` renders as custom styled `<ol>` with numbered circles
- [x] `bullets[]` renders as `<ul>` with brand-dot markers
- [x] FAQ section renders from `post.faqs[]` after the main CTA
- [x] Related tool tag pills added below FAQ section
- [x] Related articles section added (same category)

### Blog listing page (`blog/page.tsx`)
- [x] Removed hardcoded `POSTS` array — now imports from `blogPosts.ts` (single source of truth)
- [x] Separated into PDF Guides and Image Guides sections
- [x] `formatDate()` uses real `datePublished` from each post

### Individual tool page fixes
- [x] `heic-to-jpg` title: added "iPhone" keyword (2.8M searches/month)
- [x] `remove-background` FAQs: fixed misleading "limited uses" FAQ
- [x] `protect-pdf` FAQs: removed internal implementation detail, added password guidance
- [x] `add-watermark-pdf` title: improved to descriptive pattern
- [x] `excel-to-pdf` title: added "XLSX to PDF" for long-tail capture
- [x] `pdf-to-excel` title: added "PDF to XLSX" for long-tail capture
- [x] `ppt-to-pdf` title: added "PPTX to PDF" for long-tail capture

---

## 🔴 DO NEXT — Highest impact remaining actions

### 1. Submit to Google Search Console (do today)
Required before any ranking can happen. Google must discover and index the pages.

Steps:
1. Go to `search.google.com/search-console`
2. Verify `pdfandimage.com` via DNS TXT record (add to Cloudflare DNS)
3. Go to Sitemaps → submit `https://pdfandimage.com/sitemap.xml`
4. Use URL Inspection on each blog post URL → click "Request Indexing"
   - Priority URLs to request first:
     - `/blog/how-to-compress-pdf-without-losing-quality`
     - `/blog/how-to-merge-pdf-files-online-free`
     - `/blog/webp-vs-jpg-vs-png-which-format`
     - `/blog/heic-to-jpg-convert-iphone-photos`
     - `/blog/how-to-remove-background-from-image-free`
     - `/blog/ocr-pdf-extract-text-from-scanned-documents`
     - `/heic-to-jpg` (tool page, updated)
     - `/remove-background` (tool page, updated)
5. Submit remaining tool and blog URLs via Sitemaps (Google will crawl them)

### 2. Bing Webmaster Tools (do today — takes 5 minutes)
1. Go to `bing.com/webmasters`
2. Click "Import from Google Search Console" — instant setup, no manual work
3. Bing covers 6–12% of search traffic, worth zero extra effort

### 3. Submit to IndexNow (do after deploy)
Bing, Yandex, and others support IndexNow for instant indexing signals.
1. Generate a key at `indexnow.org`
2. Place the key file at `https://pdfandimage.com/{key}.txt`
3. Submit all new blog post URLs via the IndexNow API endpoint

### 4. Fix 21 remaining tool page titles (do this week)
These tool pages have titles that do not follow the `[Keyword] Online Free — [Benefit]` pattern.
Run these title updates — read the current page, then write only the `title:` line in `generateMetadata`:

| File | Current title (weak) | Target title |
|------|---------------------|--------------|
| `(pdf)/pdf-to-ppt/page.tsx` | "PDF to PowerPoint Converter Free Online" | "PDF to PowerPoint Converter Free Online — PDF to PPTX" |
| `(pdf)/reorder-pdf-pages/page.tsx` | check current | "Reorder PDF Pages Online Free — Rearrange PDF Pages" |
| `(pdf)/add-page-numbers-pdf/page.tsx` | check current | "Add Page Numbers to PDF Online Free — PDF Page Numbering" |
| `(pdf)/flatten-pdf/page.tsx` | check current | "Flatten PDF Online Free — Flatten PDF Form Fields" |
| `(pdf)/crop-pdf/page.tsx` | check current | "Crop PDF Online Free — Trim PDF Margins and Pages" |
| `(pdf)/extract-pdf-pages/page.tsx` | check current | "Extract PDF Pages Online Free — Save Pages as New PDF" |
| `(pdf)/pdf-to-pdfa/page.tsx` | check current | "PDF to PDF/A Converter Free Online — Archive Format" |
| `(image)/upscale-image/page.tsx` | check current | "Upscale Image Online Free — AI Image Upscaler 4x" |
| `(image)/add-watermark-image/page.tsx` | check current | "Add Watermark to Image Online Free — Photo Watermark Tool" |
| `(image)/svg-to-png/page.tsx` | check current | "SVG to PNG Converter Online Free — Convert SVG to PNG" |
| `(image)/image-to-base64/page.tsx` | check current | "Image to Base64 Encoder Online Free — Convert to Base64" |
| `(image)/base64-to-image/page.tsx` | check current | "Base64 to Image Decoder Online Free — Base64 Converter" |
| `(image)/grayscale-image/page.tsx` | check current | "Grayscale Image Online Free — Convert Photo to Black & White" |
| `(image)/blur-image/page.tsx` | check current | "Blur Image Online Free — Add Gaussian Blur to Photos" |
| `(image)/add-text-to-image/page.tsx` | check current | "Add Text to Image Online Free — Write on Photos" |
| `(image)/meme-generator/page.tsx` | check current | "Meme Generator Online Free — Create Memes with Custom Text" |
| `(image)/image-brightness/page.tsx` | check current | "Adjust Image Brightness & Contrast Free Online" |
| `(image)/bulk-image-compressor/page.tsx` | check current | "Bulk Image Compressor Free Online — Compress Multiple Images" |
| `(image)/gif-to-mp4/page.tsx` | check current | "GIF to MP4 Converter Online Free — Convert GIF to Video" |
| `(image)/mp4-to-gif/page.tsx` | check current | "MP4 to GIF Converter Online Free — Convert Video to GIF" |
| `(image)/png-to-svg/page.tsx` | check current | "PNG to SVG Converter Online Free — Raster to Vector" |

### 5. Add 5th FAQ to 12 tool pages that only have 4 FAQs
Google FAQ schema performs best with 5+ questions. These tool pages need one more FAQ each:

- `compress-pdf` → "Can I compress a password-protected PDF?"
  Answer: "No. Password-protected PDFs are encrypted and cannot be processed until unlocked. Use the Unlock PDF tool first to remove the password, then compress."

- `pdf-to-jpg` → "Can I choose which pages to convert to JPG?"
  Answer: "Currently all pages are converted. To convert only specific pages, use the Split PDF tool first to extract those pages, then convert the smaller PDF."

- `jpg-to-pdf` → "Can I reorder the images before converting?"
  Answer: "The images are placed in the PDF in the order you select them. Select files in the exact order you want them to appear, or use the Reorder PDF Pages tool after converting to rearrange."

- `rotate-pdf` → "Why is my PDF displaying sideways after scanning?"
  Answer: "Scanners sometimes save documents in the wrong orientation, especially with automatic document feeders. The Rotate PDF tool permanently fixes the page orientation in the output file."

- `compress-image` → "What is the best quality setting for compressing a photo?"
  Answer: "80–85% quality is the sweet spot for web use — it produces files 50–80% smaller with no visible quality difference at normal viewing sizes. Below 70%, compression artifacts start appearing."

- `resize-image` → "What happens if I only enter width without height?"
  Answer: "With aspect ratio lock enabled (the default), the height is calculated automatically to maintain the original proportions. This prevents the image from looking stretched or squashed."

- `crop-image` → "Can I crop to exact pixel dimensions?"
  Answer: "Select the Free crop mode and set the crop area manually. The output dimensions are shown as you adjust the crop handles. For a precise crop, enter exact dimensions if your device supports touch input."

- `png-to-jpg` → "What quality should I use when converting PNG to JPG?"
  Answer: "85% quality is the standard recommendation. It produces files that are 60–80% smaller than the PNG with no visible quality difference at normal viewing sizes."

- `jpg-to-png` → "Why does my JPG become larger after converting to PNG?"
  Answer: "PNG is a lossless format that stores every pixel — this is always larger than a JPG for photographs. The benefit of converting to PNG is gaining support for transparency and lossless editing, not smaller file size."

- `rotate-image` → "Does rotating an image reduce quality?"
  Answer: "No. The rotation is applied to the raw pixel data before re-encoding. When saved at high quality (95%), the output is visually identical to the original."

- `flip-image` → "What is the difference between flipping and rotating an image?"
  Answer: "Rotating turns the image clockwise or counter-clockwise (90°, 180°, 270°). Flipping mirrors the image horizontally (left-right) or vertically (top-bottom). They are different operations."

- `image-to-webp` → "Is WebP supported by all browsers?"
  Answer: "Yes — all modern browsers support WebP: Chrome, Firefox, Safari (since 2020), and Edge. The only exceptions are very old browsers (IE11, Safari before 2020). For websites, WebP is safe to use for all modern users."

### 6. Create OG image for blog posts (`opengraph-image.tsx`)
Create `src/app/blog/[slug]/opengraph-image.tsx`:

```typescript
import { ImageResponse } from 'next/og'
import { getBlogPostBySlug } from '@/lib/blogPosts'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug)
  if (!post) return new ImageResponse(<div style={{ background: '#0f172a', width: '100%', height: '100%' }} />, { ...size })

  return new ImageResponse(
    (
      <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '64px' }}>
        <div style={{ color: '#60a5fa', fontSize: 20, marginBottom: 16, fontFamily: 'sans-serif' }}>
          {post.category} — pdfandimage.com
        </div>
        <div style={{ color: 'white', fontSize: 52, fontWeight: 700, lineHeight: 1.15, fontFamily: 'sans-serif', maxWidth: 950 }}>
          {post.title}
        </div>
      </div>
    ),
    { ...size }
  )
}
```

### 7. AlternativeTo.net backlink (do this week)
1. Go to `alternativeto.net` → sign up → Add Software
2. Name: "PDF and Image +"
3. Category: Productivity → PDF Tools
4. List as alternative to: ILovePDF, Smallpdf, TinyWow, Adobe Acrobat Online
5. Fill in description emphasizing: free, browser-based, no file uploads, no registration
6. This creates a permanent DA60+ do-follow backlink with zero cost

### 8. ProductHunt launch (when you hit 500+ daily visitors)
Wait until you have real traffic so the launch gets votes from genuine users.
Then launch on a Tuesday morning (US time) with:
- Tagline: "50+ PDF and image tools that run entirely in your browser"
- First comment: list your 5 most popular tools with direct links
- Mention privacy angle prominently — it is your strongest differentiator

---

## 📊 What to track weekly in Google Search Console

Once GSC is set up, check every Monday morning (10 minutes):

**Performance tab → Last 28 days:**
- Total Clicks: should be growing week-over-week after month 3
- Average Position: track per URL — anything between 6–20 is a "quick win" target
- Impressions: growing impressions with flat clicks = fix the title/meta for CTR

**Pages tab sorted by Impressions (descending):**
- Pages with 500+ impressions but position 8–20 are your priority optimisation targets
- For those pages: improve H1 to better match the search query, add more FAQ content

**Coverage tab:**
- Fix any "Excluded" or "Error" pages immediately
- "Crawled but not indexed" = add more content to those pages

**Core Web Vitals tab:**
- Fix any "Poor" URLs before month 2 — Google uses CWV as a tie-breaker for ranking

---

## 📈 Realistic ranking timeline for pdfandimage.com

| Timeframe | Expected outcome |
|-----------|-----------------|
| Week 1–2 | Pages indexed, no rankings yet |
| Month 1 | Branded queries appear, some blog posts show in positions 40–80 |
| Month 2–3 | Blog posts move to positions 20–40, tool pages start appearing |
| Month 3–4 | Long-tail blog posts enter page 1–2 (positions 8–20) |
| Month 4–6 | FAQ/HowTo rich results appear, tool pages in positions 10–30 |
| Month 6–9 | Main tool pages hitting page 1 for long-tail variants |
| Month 9–12 | Competitive keywords entering top 10 |

**The key insight:** The blog posts with FAQ schema and HowTo schema will rank fastest — often within 4–8 weeks of indexing — because Google can show them in People Also Ask and How-To featured result boxes even before the page has high authority. This is the fastest legitimate path to visibility for a new domain.
