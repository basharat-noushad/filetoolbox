export async function blurImage(file: File, radius: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.filter = `blur(${radius}px)`
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Failed')),
        file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}
