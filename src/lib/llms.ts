import { tools } from '@/lib/toolsRegistry'
import { BLOG_POSTS } from '@/lib/blogPosts'
import { SITE_URL, usesProcessingServer } from '@/lib/seo'

// llms.txt (https://llmstxt.org): one H1, a blockquote summary, then H2 sections of
// Markdown links "- [Name](url): note". Built from the registry so it never drifts.
const link = (name: string, path: string, note?: string) =>
  `- [${name}](${SITE_URL}${path})${note ? `: ${note}` : ''}`

export function buildLlmsTxt(): string {
  const toolLines = (category: 'pdf' | 'image') =>
    tools
      .filter(t => t.category === category)
      .map(t => link(t.name, `/${t.slug}`, t.description + (usesProcessingServer(t.slug) ? ' (server processing)' : '')))

  return [
    '# PDF and Image',
    '',
    `> PDF and Image (pdfandimage.com) is a free online toolkit with ${tools.length} PDF and image tools. No sign-up, no watermarks. Most tools process files locally in the browser; tools marked "server processing" upload the file to a processing service.`,
    '',
    'Key facts: free (ad-supported); no registration or subscription; no watermarks; English interface; works on desktop and mobile browsers. File-size and device limits apply to some tools.',
    '',
    '## PDF Tools',
    '',
    ...toolLines('pdf'),
    '',
    '## Image Tools',
    '',
    ...toolLines('image'),
    '',
    '## Guides',
    '',
    ...BLOG_POSTS.map(p => link(p.title, `/blog/${p.slug}`, p.excerpt)),
    '',
    '## Optional',
    '',
    link('About PDF and Image', '/about', 'Who runs the site and how files are handled'),
    link('Privacy Policy', '/privacy', 'What is processed locally vs. on a server'),
    link('Help', '/help'),
    link('Contact', '/contact'),
    link('Blog', '/blog'),
    link('Full tool reference for LLMs', '/llms-full.txt'),
    '',
  ].join('\n')
}
