import { guardUpload, upstreamError, upstreamFetch } from '@/lib/apiGuard'

export async function POST(request: Request) {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey || apiKey === 'your_key_here') {
    return new Response('Background removal service not configured. Please add a REMOVE_BG_API_KEY.', { status: 503 })
  }

  // Stricter budget than Stirling: every call here spends paid remove.bg credits.
  const upload = await guardUpload(request, { exts: ['jpg', 'jpeg', 'png', 'webp'], bucket: 'removebg', perHour: 5 })
  if (upload instanceof Response) return upload

  const bgForm = new FormData()
  bgForm.append('image_file', upload.blob, upload.name)
  bgForm.append('size', 'auto')

  const res = await upstreamFetch('remove-background', 'https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: bgForm,
  }, 30_000)

  if (!res.ok) return upstreamError('remove-background', res, 'Background removal failed.')

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="no-background.png"',
    },
  })
}
