import { Tool } from '@/types/tools'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com').replace(/\/$/, '')
const ORG_NAME = 'PDF and Image +'

export function StructuredData({ tool, howToSteps, faqs }: {
  tool: Tool
  howToSteps: string[]
  faqs: { q: string; a: string }[]
}) {
  const toolUrl = `${SITE_URL}/${tool.slug}`

  // ── 1. Breadcrumb ──────────────────────────────────────────────────────────
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: `${tool.category === 'pdf' ? 'PDF' : 'Image'} Tools`, item: `${SITE_URL}/#${tool.category}-tools` },
      { '@type': 'ListItem', position: 3, name: tool.name, item: toolUrl },
    ],
  }

  // ── 2. HowTo — triggers How-To rich results in Google + AI step extraction ─
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to ${tool.name} Online for Free`,
    description: tool.description,
    url: toolUrl,
    totalTime: 'PT1M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    supply: [],
    tool: [{ '@type': 'HowToTool', name: 'Web browser (Chrome, Firefox, Safari, or Edge)' }],
    step: howToSteps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: `Step ${i + 1}`,
      text,
      url: toolUrl,
    })),
  }

  // ── 3. FAQPage — triggers People Also Ask + AI answer extraction ───────────
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
        author: { '@type': 'Organization', name: ORG_NAME, url: SITE_URL },
      },
    })),
  }

  // ── 4. SoftwareApplication — AI models use this to understand what the tool is
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${tool.name} — ${ORG_NAME}`,
    url: toolUrl,
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: tool.category === 'pdf' ? 'PDF Tool' : 'Image Tool',
    operatingSystem: 'Any — Web Browser',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to use, no registration required',
      availability: 'https://schema.org/InStock',
    },
    description: tool.description,
    featureList: [
      'Free to use with no registration',
      'Files processed locally in the browser',
      'No file size limits',
      'No watermarks on output files',
      'Works on desktop, tablet, and mobile',
      'Supports Chrome, Firefox, Safari, and Edge',
    ],
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` },
    },
    isPartOf: {
      '@type': 'WebSite',
      name: ORG_NAME,
      url: SITE_URL,
    },
  }

  // ── 5. WebPage — AIO/GEO: gives AI crawlers explicit page entity context ────
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${tool.name} Online Free — ${ORG_NAME}`,
    url: toolUrl,
    description: tool.description,
    isPartOf: { '@type': 'WebSite', name: ORG_NAME, url: SITE_URL },
    about: {
      '@type': 'SoftwareApplication',
      name: tool.name,
      applicationCategory: tool.category === 'pdf' ? 'PDF Utility' : 'Image Utility',
    },
    keywords: tool.keywords.join(', '),
    inLanguage: 'en',
    datePublished: '2025-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    publisher: { '@type': 'Organization', name: ORG_NAME, url: SITE_URL },
    // Speakable — helps Google Assistant and voice search read key content
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'h2', '.tool-description'],
    },
  }

  return (
    <>
      {[breadcrumb, howTo, faqPage, softwareApp, webPage].map((schema, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  )
}
