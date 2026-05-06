export async function grayscaleImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.filter = 'grayscale(100%)'
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Conversion failed')),
        file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}
