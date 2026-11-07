import { adobeRoute } from '@/lib/adobe'

export const maxDuration = 60

export async function POST(request: Request) {
  return adobeRoute(request, {
    exts: ['xlsx', 'xls'],
    op: 'createpdf',
    contentType: 'application/pdf',
    filename: 'converted.pdf',
  })
}
