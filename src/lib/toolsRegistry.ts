import { Tool } from '@/types/tools'

export const tools: Tool[] = [
  // ── PDF Tier 1 ────────────────────────────────────────────────────────
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document. Fast, free, and secure — no upload required.',
    category: 'pdf', icon: 'FilePlus2',
    keywords: ['merge pdf', 'combine pdf', 'join pdf online free'],
    relatedTools: ['split-pdf', 'compress-pdf', 'rotate-pdf'], tier: 1,
  },
  {
    slug: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF file size without losing quality. Ideal for email attachments and uploads.',
    category: 'pdf', icon: 'FileDown',
    keywords: ['compress pdf', 'reduce pdf size', 'pdf compressor online free'],
    relatedTools: ['merge-pdf', 'pdf-to-jpg', 'split-pdf'], tier: 1,
  },
  {
    slug: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF files to editable Word documents (.docx) instantly. No email required.',
    category: 'pdf', icon: 'FileText',
    keywords: ['pdf to word', 'pdf to docx', 'convert pdf to word free'],
    relatedTools: ['word-to-pdf', 'compress-pdf', 'merge-pdf'], tier: 1,
  },
  {
    slug: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert Word documents (.docx, .doc) to PDF format. Preserves formatting perfectly.',
    category: 'pdf', icon: 'FileOutput',
    keywords: ['word to pdf', 'docx to pdf', 'convert word to pdf free'],
    relatedTools: ['pdf-to-word', 'compress-pdf', 'merge-pdf'], tier: 1,
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    description: 'Split a PDF into multiple files by page range or extract individual pages.',
    category: 'pdf', icon: 'Scissors',
    keywords: ['split pdf', 'extract pdf pages', 'split pdf online free'],
    relatedTools: ['merge-pdf', 'delete-pdf-pages', 'rotate-pdf'], tier: 1,
  },
  {
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Convert each page of a PDF to a high-quality JPG image. Download individually or as a ZIP.',
    category: 'pdf', icon: 'Image',
    keywords: ['pdf to jpg', 'pdf to image', 'convert pdf to jpg online'],
    relatedTools: ['jpg-to-pdf', 'pdf-to-png', 'compress-image'], tier: 1,
  },
  {
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Convert JPG images to a PDF file. Add multiple images and arrange them in any order.',
    category: 'pdf', icon: 'FileImage',
    keywords: ['jpg to pdf', 'image to pdf', 'convert jpg to pdf online free'],
    relatedTools: ['pdf-to-jpg', 'merge-pdf', 'compress-pdf'], tier: 1,
  },
  {
    slug: 'rotate-pdf',
    name: 'Rotate PDF',
    description: 'Rotate all or selected pages of a PDF by 90°, 180°, or 270°. Fix scanned documents.',
    category: 'pdf', icon: 'RotateCw',
    keywords: ['rotate pdf', 'rotate pdf pages', 'rotate pdf online free'],
    relatedTools: ['merge-pdf', 'split-pdf', 'delete-pdf-pages'], tier: 1,
  },
  {
    slug: 'pdf-to-png',
    name: 'PDF to PNG',
    description: 'Convert PDF pages to transparent PNG images. Perfect for presentations and web use.',
    category: 'pdf', icon: 'FileImage',
    keywords: ['pdf to png', 'pdf to image png', 'convert pdf to png online'],
    relatedTools: ['pdf-to-jpg', 'jpg-to-pdf', 'compress-image'], tier: 1,
  },
  {
    slug: 'delete-pdf-pages',
    name: 'Delete PDF Pages',
    description: 'Remove specific pages or page ranges from a PDF document. Preview before deleting.',
    category: 'pdf', icon: 'Trash2',
    keywords: ['delete pdf pages', 'remove pages from pdf', 'delete pages pdf online'],
    relatedTools: ['split-pdf', 'rotate-pdf', 'merge-pdf'], tier: 1,
  },

  // ── Image Tier 1 ──────────────────────────────────────────────────────
  {
    slug: 'compress-image',
    name: 'Compress Image',
    description: 'Reduce image file size without visible quality loss. Supports JPG, PNG, WebP.',
    category: 'image', icon: 'ImageDown',
    keywords: ['compress image', 'reduce image size', 'image compressor online free'],
    relatedTools: ['resize-image', 'png-to-jpg', 'image-to-webp'], tier: 1,
  },
  {
    slug: 'resize-image',
    name: 'Resize Image',
    description: 'Resize images to any dimension. Set width, height, or percentage. Aspect ratio lock.',
    category: 'image', icon: 'Maximize2',
    keywords: ['resize image', 'image resizer online', 'change image size free'],
    relatedTools: ['compress-image', 'crop-image', 'png-to-jpg'], tier: 1,
  },
  {
    slug: 'crop-image',
    name: 'Crop Image',
    description: 'Crop images with an interactive cropper. Set custom dimensions or use preset ratios.',
    category: 'image', icon: 'Crop',
    keywords: ['crop image', 'crop image online', 'image cropper free'],
    relatedTools: ['resize-image', 'compress-image', 'rotate-image'], tier: 1,
  },
  {
    slug: 'png-to-jpg',
    name: 'PNG to JPG',
    description: 'Convert PNG images to JPG format. Control compression quality. Batch supported.',
    category: 'image', icon: 'ArrowRightLeft',
    keywords: ['png to jpg', 'convert png to jpeg', 'png to jpg online free'],
    relatedTools: ['jpg-to-png', 'compress-image', 'image-to-webp'], tier: 1,
  },
  {
    slug: 'jpg-to-png',
    name: 'JPG to PNG',
    description: 'Convert JPG/JPEG images to PNG format with transparency support.',
    category: 'image', icon: 'ArrowRightLeft',
    keywords: ['jpg to png', 'jpeg to png', 'convert jpg to png online free'],
    relatedTools: ['png-to-jpg', 'compress-image', 'webp-to-png'], tier: 1,
  },
  {
    slug: 'remove-background',
    name: 'Remove Background',
    description: 'Automatically remove the background from any photo in seconds. Powered by AI.',
    category: 'image', icon: 'Wand2',
    keywords: ['remove background', 'background remover', 'remove image background free'],
    relatedTools: ['compress-image', 'png-to-jpg', 'resize-image'], tier: 1,
  },
  {
    slug: 'webp-to-png',
    name: 'WebP to PNG',
    description: 'Convert WebP images to PNG format. Useful for compatibility with older software.',
    category: 'image', icon: 'FileImage',
    keywords: ['webp to png', 'convert webp to png', 'webp to png online free'],
    relatedTools: ['png-to-jpg', 'jpg-to-png', 'image-to-webp'], tier: 1,
  },
  {
    slug: 'rotate-image',
    name: 'Rotate Image',
    description: 'Rotate images 90°, 180°, or 270°. Fix orientation of photos taken on mobile.',
    category: 'image', icon: 'RotateCw',
    keywords: ['rotate image', 'rotate photo online', 'rotate image free'],
    relatedTools: ['flip-image', 'crop-image', 'resize-image'], tier: 1,
  },
  {
    slug: 'flip-image',
    name: 'Flip Image',
    description: 'Flip images horizontally or vertically. Mirror any photo in one click.',
    category: 'image', icon: 'FlipHorizontal',
    keywords: ['flip image', 'mirror image online', 'flip photo free'],
    relatedTools: ['rotate-image', 'crop-image', 'compress-image'], tier: 1,
  },
  {
    slug: 'image-to-webp',
    name: 'Convert to WebP',
    description: 'Convert JPG or PNG images to WebP format. Smaller files, better web performance.',
    category: 'image', icon: 'Zap',
    keywords: ['image to webp', 'convert to webp', 'jpg to webp online free'],
    relatedTools: ['webp-to-png', 'compress-image', 'png-to-jpg'], tier: 1,
  },
]

export const getToolBySlug = (slug: string): Tool | undefined =>
  tools.find(t => t.slug === slug)

export const getToolsByCategory = (category: 'pdf' | 'image'): Tool[] =>
  tools.filter(t => t.category === category)

export const getRelatedTools = (tool: Tool): Tool[] =>
  tool.relatedTools.map(slug => getToolBySlug(slug)).filter((t): t is Tool => t !== undefined)
