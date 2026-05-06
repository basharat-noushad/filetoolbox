export async function addTextToImage(
  file: File,
  text: string,
  options: { x?: number; y?: number; fontSize?: number; color?: string; fontFamily?: string }
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

      const size = options.fontSize ?? 48
      ctx.font = `bold ${size}px ${options.fontFamily ?? 'Arial'}`
      ctx.fillStyle = options.color ?? '#ffffff'
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'
      ctx.lineWidth = Math.max(2, size / 20)
      ctx.strokeText(text, options.x ?? 40, options.y ?? size + 20)
      ctx.fillText(text, options.x ?? 40, options.y ?? size + 20)

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Failed')),
        file.type || 'image/jpeg', 0.92
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}
