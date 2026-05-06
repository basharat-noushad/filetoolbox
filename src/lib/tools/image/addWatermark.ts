export async function addWatermarkToImage(
  file: File,
  text: string,
  options: { opacity?: number; fontSize?: number; position?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'; color?: string }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      const size = options.fontSize ?? Math.max(24, Math.floor(img.naturalWidth / 20))
      ctx.font = `bold ${size}px Arial`
      ctx.globalAlpha = options.opacity ?? 0.5
      ctx.fillStyle = options.color ?? '#ffffff'
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 2

      const textW = ctx.measureText(text).width
      const pos = options.position ?? 'bottom-right'
      const pad = 20
      let x = canvas.width / 2 - textW / 2
      let y = canvas.height / 2

      if (pos === 'bottom-right') { x = canvas.width - textW - pad; y = canvas.height - pad }
      else if (pos === 'bottom-left') { x = pad; y = canvas.height - pad }
      else if (pos === 'top-right') { x = canvas.width - textW - pad; y = size + pad }
      else if (pos === 'top-left') { x = pad; y = size + pad }

      ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
      ctx.globalAlpha = 1

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Failed')),
        file.type || 'image/jpeg', 0.92
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}
