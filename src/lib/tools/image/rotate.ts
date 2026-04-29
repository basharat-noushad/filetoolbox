export async function rotateImage(file: File, deg: 90 | 180 | 270): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const swap = deg === 90 || deg === 270
      const canvas = document.createElement('canvas')
      canvas.width  = swap ? img.naturalHeight : img.naturalWidth
      canvas.height = swap ? img.naturalWidth  : img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((deg * Math.PI) / 180)
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Rotation failed')), file.type || 'image/jpeg', 0.95)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}
