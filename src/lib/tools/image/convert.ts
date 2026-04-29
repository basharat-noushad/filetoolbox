type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp'

export async function convertImageFormat(file: File, toFormat: OutputFormat, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      if (toFormat === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height) }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Conversion failed')), toFormat, quality)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}
