export async function POST(request: Request) {
  const gotenbergUrl = process.env.GOTENBERG_URL
  if (!gotenbergUrl) {
    return new Response('Conversion service not configured.', { status: 503 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return new Response('No file provided.', { status: 400 })

  const gForm = new FormData()
  gForm.append('files', new Blob([await file.arrayBuffer()], { type: 'application/pdf' }), file.name)

  const res = await fetch(`${gotenbergUrl}/forms/libreoffice/convert/docx`, {
    method: 'POST',
    body: gForm,
    cache: 'no-store',
  })

  if (!res.ok) return new Response('Conversion failed.', { status: 502 })

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="converted.docx"',
    },
  })
}
