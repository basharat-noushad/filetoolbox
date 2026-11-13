import { writeFile, mkdir } from 'node:fs/promises'

// Read-only HTTP audit. Use a local production server to verify changes before deploy.
const base = new URL(process.argv[2] || 'https://pdfandimage.com')
const label = process.argv[3] || 'live'
if (!/^[a-z0-9-]+$/i.test(label)) throw new Error('Use an alphanumeric report label')
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)=["']([^"']*)["']/g)].map(m => [m[1], decode(m[2])]))
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
  return { response, text: await response.text() }
}
const robots = await get(new URL('/robots.txt', base))
const sitemap = await get(new URL('/sitemap.xml', base))
if (!sitemap.response.ok || !sitemap.text.includes('<urlset')) throw new Error('Sitemap is unavailable or invalid')
const locations = [...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decode(m[1]))
const pages = []
let cursor = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < locations.length) {
    const canonical = locations[cursor++]
    const url = new URL(new URL(canonical).pathname, base)
    try {
      const { response, text } = await get(url)
      const metas = [...text.matchAll(/<meta\s[^>]*>/g)].map(m => attrs(m[0]))
      const links = [...text.matchAll(/<link\s[^>]*>/g)].map(m => attrs(m[0]))
      const schemas = [...text.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => {
        try { return JSON.parse(m[1]) } catch { return { error: 'Invalid JSON-LD' } }
      })
      pages.push({
        path: url.pathname, status: response.status, finalUrl: response.url,
        title: decode(text.match(/<title>([\s\S]*?)<\/title>/)?.[1] || ''),
        description: metas.find(m => m.name === 'description')?.content,
        canonical: links.find(m => m.rel === 'canonical')?.href,
        expectedCanonical: canonical,
        robots: metas.filter(m => ['robots', 'googlebot'].includes(m.name)),
        xRobotsTag: response.headers.get('x-robots-tag'),
        h1: [...text.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(m => decode(m[1].replace(/<[^>]*>/g, ''))),
        ogUrl: metas.find(m => m.property === 'og:url')?.content,
        ogImage: metas.find(m => m.property === 'og:image')?.content,
        schemas,
      })
    } catch (error) { pages.push({ path: url.pathname, error: error.message }) }
  }
}))
pages.sort((a,b) => a.path.localeCompare(b.path))
const issues = pages.flatMap(page => {
  const issues = []
  if (page.error || page.status !== 200) issues.push('Page not accessible')
  if (!page.title) issues.push('Missing title')
  if ((page.title?.match(/PDF and Image \+/g) || []).length > 1) issues.push('Repeated brand in title')
  if (!page.description) issues.push('Missing description')
  if (page.canonical?.replace(/\/$/, '') !== page.expectedCanonical?.replace(/\/$/, '')) issues.push('Canonical differs from sitemap')
  if (page.h1?.length !== 1) issues.push('Expected one H1')
  if (page.robots?.some(m => /noindex/.test(m.content)) || /noindex/.test(page.xRobotsTag || '')) issues.push('Noindex in sitemap')
  if (page.schemas?.some(s => s.error)) issues.push('Invalid JSON-LD')
  if (page.schemas?.some(s => s['@type'] === 'SiteLinksSearchBox')) issues.push('Invalid SiteLinksSearchBox schema type')
  return issues.map(issue => ({ path: page.path, issue }))
})
if (/Disallow:\s*\/_next\//i.test(robots.text)) issues.push({ path: '/robots.txt', issue: 'Next.js rendering assets blocked' })
// Check every distinct preview image referenced by the rendered metadata,
// not just HTML status codes: ImageResponse can fail after HTML builds pass.
const images = [...new Set(pages.map(page => page.ogImage).filter(Boolean))]
const imageResults = []
let imageCursor = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (imageCursor < images.length) {
    const source = images[imageCursor++]
    const sourceUrl = new URL(source)
    const url = new URL(sourceUrl.pathname + sourceUrl.search, base)
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
      const bytes = await response.arrayBuffer()
      const type = response.headers.get('content-type') || ''
      imageResults.push({ path: url.pathname, status: response.status, type, bytes: bytes.byteLength })
      if (!response.ok || !type.startsWith('image/') || !bytes.byteLength) issues.push({ path: url.pathname, issue: 'Preview image not accessible' })
    } catch (error) {
      imageResults.push({ path: url.pathname, error: error.message })
      issues.push({ path: url.pathname, issue: 'Preview image not accessible' })
    }
  }
}))
const report = { checkedAt: new Date().toISOString(), base: base.origin, count: pages.length, robots: robots.text, sitemap: sitemap.text, issues, pages, images: imageResults }
await mkdir('seo/reports', { recursive: true })
await writeFile(`seo/reports/technical-${label}.json`, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ base: base.origin, pages: pages.length, issues, report: `seo/reports/technical-${label}.json` }, null, 2))
if (issues.length) process.exitCode = 1
