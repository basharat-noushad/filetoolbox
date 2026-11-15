import type { LucideIcon } from 'lucide-react'
import {
  FilePlus2, Scissors, FileDown, FileText, FileOutput, Image as ImageIcon,
  FileImage, Table2, FileSpreadsheet, Presentation, RotateCw, LockOpen, Lock,
  Stamp, PenLine, Crop, ArrowUpDown, Trash2, FolderOutput, Hash,
  ScanText, Layers, Archive, ImageDown, Maximize2, ArrowRightLeft, Zap, Film,
  FlipHorizontal, Contrast, Wand2, Type, Blend, Sun, ZoomIn, Smartphone,
  Code, Laugh, FolderDown, Clapperboard, MonitorPlay, QrCode, ScanLine,
  IdCard, Music, Sparkles,
} from 'lucide-react'

export type ToolItem = {
  slug: string
  name: string
  description: string
  category: 'pdf' | 'image'
  server: boolean
}

/** Tools that always send the file to a server (remove.bg). */
export const SERVER_SLUGS = new Set(['remove-background'])

/** Office conversions run in the browser first and only use a server (Adobe) for scanned or
 *  complex files, or when the user retries online — see src/app/privacy/page.tsx. */
export const HYBRID_SLUGS = new Set([
  'pdf-to-word', 'word-to-pdf', 'pdf-to-excel', 'excel-to-pdf', 'pdf-to-ppt', 'ppt-to-pdf',
])

export const POPULAR_SLUGS = [
  'merge-pdf', 'compress-pdf', 'pdf-to-word', 'compress-image',
  'remove-background', 'passport-photo-maker', 'qr-code-generator', 'image-to-text',
] as const

export const TOOL_ICONS: Record<string, LucideIcon> = {
  'merge-pdf': FilePlus2, 'split-pdf': Scissors, 'compress-pdf': FileDown,
  'pdf-to-word': FileText, 'word-to-pdf': FileOutput, 'pdf-to-jpg': ImageIcon,
  'jpg-to-pdf': FileImage, 'pdf-to-png': FileImage, 'pdf-to-excel': Table2,
  'excel-to-pdf': FileSpreadsheet, 'pdf-to-ppt': Presentation, 'ppt-to-pdf': FileOutput,
  'rotate-pdf': RotateCw, 'unlock-pdf': LockOpen, 'protect-pdf': Lock,
  'add-watermark-pdf': Stamp, 'sign-pdf': PenLine, 'crop-pdf': Crop,
  'reorder-pdf-pages': ArrowUpDown, 'delete-pdf-pages': Trash2, 'extract-pdf-pages': FolderOutput,
  'add-page-numbers-pdf': Hash, 'ocr-pdf': ScanText, 'flatten-pdf': Layers,
  'pdf-to-pdfa': Archive, 'compress-image': ImageDown, 'resize-image': Maximize2,
  'crop-image': Crop, 'png-to-jpg': ArrowRightLeft, 'jpg-to-png': ArrowRightLeft,
  'image-to-webp': Zap, 'webp-to-png': ArrowRightLeft, 'rotate-image': RotateCw,
  'flip-image': FlipHorizontal, 'grayscale-image': Contrast, 'remove-background': Wand2,
  'add-watermark-image': Stamp, 'add-text-to-image': Type, 'blur-image': Blend,
  'image-brightness': Sun, 'upscale-image': ZoomIn, 'heic-to-jpg': Smartphone,
  'svg-to-png': FileImage, 'image-to-base64': Code, 'base64-to-image': ImageDown,
  'bulk-image-compressor': FolderDown, 'gif-to-mp4': Film, 'mp4-to-gif': Clapperboard,
  'meme-generator': Laugh, 'png-to-svg': MonitorPlay,
  'webp-to-jpg': ArrowRightLeft, 'avif-to-jpg': ArrowRightLeft, 'bmp-to-jpg': ArrowRightLeft,
  'png-to-pdf': FileImage, 'image-to-pdf': FileImage, 'pdf-to-text': FileText,
  'txt-to-pdf': FileOutput, 'image-to-text': ScanText, 'qr-code-generator': QrCode,
  'qr-code-scanner': ScanLine, 'favicon-generator': Sparkles, 'mp4-to-mp3': Music,
  'passport-photo-maker': IdCard,
}

export function iconFor(slug: string, category: 'pdf' | 'image'): LucideIcon {
  return TOOL_ICONS[slug] ?? (category === 'pdf' ? FileText : ImageIcon)
}

/** Lane tokens (One Lane Rule): indigo = PDF, emerald = Image. */
export const LANE = {
  pdf: {
    chip: 'bg-brand-50 text-brand-600 group-hover:bg-brand-100',
    border: 'border-brand-100 hover:border-brand-400 hover:shadow-brand-500/10',
    text: 'text-brand-700',
  },
  image: {
    chip: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100',
    border: 'border-emerald-100 hover:border-emerald-400 hover:shadow-emerald-500/10',
    text: 'text-emerald-700',
  },
} as const

export const EASE = [0.16, 1, 0.3, 1] as const
