export async function POST(request: Request) {
  const apiKey = process.env.REMOVE_BG_API_KEY
  if (!apiKey || apiKey === 'your_key_here') {
    return new Response('Background removal service not configured. Please add a REMOVE_BG_API_KEY.', { status: 503 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return new Response('No file provided.', { status: 400 })

  const bgForm = new FormData()
  bgForm.append('image_file', new Blob([await file.arrayBuffer()], { type: file.type }), file.name)
  bgForm.append('size', 'auto')

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: bgForm,
    cache: 'no-store',
  })

  if (!res.ok) return new Response('Background removal failed.', { status: 502 })

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="no-background.png"',
    },
  })
}
