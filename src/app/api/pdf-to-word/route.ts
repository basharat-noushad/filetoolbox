import { adobeRoute } from '@/lib/adobe'

export const maxDuration = 60

export async function POST(request: Request) {
  return adobeRoute(request, {
    exts: ['pdf'],
    op: 'exportpdf',
    targetFormat: 'docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'converted.docx',
  })
}
