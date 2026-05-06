import { Tool } from '@/types/tools'

export function StructuredData({ tool, howToSteps, faqs }: {
  tool: Tool
  howToSteps: string[]
  faqs: { q: string; a: string }[]
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pdfandimage.com'
  const toolUrl = `${siteUrl}/${tool.slug}`

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: tool.name, item: toolUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to ${tool.name}`,
      description: tool.description,
      totalTime: 'PT1M',
      tool: [{ '@type': 'HowToTool', name: 'Web browser' }],
      step: howToSteps.map((text, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: `Step ${i + 1}`,
        text,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `${tool.name} — PDF and Image +`,
      url: toolUrl,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: tool.description,
      featureList: ['Free to use', 'No registration required', 'Browser-based processing', 'Files stay private'],
      publisher: { '@type': 'Organization', name: 'PDF and Image +', url: siteUrl },
    },
  ]

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  )
}
