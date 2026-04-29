export type ToolCategory = 'pdf' | 'image'

export interface Tool {
  slug: string
  name: string
  description: string
  category: ToolCategory
  icon: string
  keywords: string[]
  relatedTools: string[]
  tier: 1 | 2 | 3
}

export interface ProcessingResult {
  blob: Blob
  filename: string
  mimeType: string
}
