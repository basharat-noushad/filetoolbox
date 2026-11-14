/** Composite a transparent PNG onto a solid colour (or keep transparent when bg is null). Runs fully client-side. */
export async function composeBackground(png: Blob, bg: string | null, type: 'image/png' | 'image/jpeg' = 'image/png'): Promise<Blob> {
  const bmp = await createImageBitmap(png)
  const canvas = document.createElement('canvas')
  canvas.width = bmp.width
  canvas.height = bmp.height
  const ctx = canvas.getContext('2d')!
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height) }
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), type, 0.95))
}
