export interface ResizeOptions { width?: number; height?: number; keepAspectRatio?: boolean; format?: string; quality?: number }

export async function resizeImage(file: File, options: ResizeOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = options
      const ar = img.naturalWidth / img.naturalHeight
      if (options.keepAspectRatio !== false) {
        if (width && !height) height = Math.round(width / ar)
        else if (height && !width) width = Math.round(height * ar)
        else if (!width && !height) { width = img.naturalWidth; height = img.naturalHeight }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width!; canvas.height = height!
      canvas.getContext('2d')!.drawImage(img, 0, 0, width!, height!)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Resize failed')), options.format || file.type || 'image/jpeg', options.quality ?? 0.92)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}
