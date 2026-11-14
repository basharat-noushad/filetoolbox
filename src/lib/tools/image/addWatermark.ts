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

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

export interface LogoWatermarkOptions {
  opacity?: number // 0-1
  sizePct?: number // logo width as % of image width
  position?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  tile?: boolean
}

export async function addLogoToImage(file: File, logo: File, options: LogoWatermarkOptions = {}): Promise<Blob> {
  const [img, logoImg] = await Promise.all([loadImage(file), loadImage(logo)])
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // SVGs without intrinsic size report 0; fall back to a square.
  const lw0 = logoImg.naturalWidth || 300
  const lh0 = logoImg.naturalHeight || 300
  const w = Math.max(1, Math.round(canvas.width * (options.sizePct ?? 20) / 100))
  const h = Math.max(1, Math.round(w * lh0 / lw0))
  ctx.globalAlpha = options.opacity ?? 0.6
  if (options.tile) {
    const gap = Math.round(w * 0.5)
    for (let y = gap / 2, row = 0; y < canvas.height; y += h + gap, row++) {
      for (let x = (row % 2 ? (w + gap) / 2 : 0) + gap / 2; x < canvas.width; x += w + gap) ctx.drawImage(logoImg, x, y, w, h)
    }
  } else {
    const pad = Math.round(canvas.width * 0.02)
    const pos = options.position ?? 'bottom-right'
    const x = pos === 'center' ? (canvas.width - w) / 2 : pos.endsWith('right') ? canvas.width - w - pad : pad
    const y = pos === 'center' ? (canvas.height - h) / 2 : pos.startsWith('bottom') ? canvas.height - h - pad : pad
    ctx.drawImage(logoImg, x, y, w, h)
  }
  ctx.globalAlpha = 1
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed')), file.type || 'image/jpeg', 0.92))
}
