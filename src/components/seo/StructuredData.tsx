import { Tool } from '@/types/tools'

export function StructuredData({ tool, howToSteps, faqs }: {
  tool: Tool
  howToSteps: string[]
  faqs: { q: string; a: string }[]
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://filetoolbox.com'

  const schemas = [
    {
      '@context': 'https://schema.org', '@type': 'HowTo',
      name: `How to ${tool.name}`, description: tool.description,
      step: howToSteps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question', name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
    {
      '@context': 'https://schema.org', '@type': 'WebApplication',
      name: `${tool.name} — FileToolBox`,
      url: `${siteUrl}/${tool.slug}`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: tool.description,
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
