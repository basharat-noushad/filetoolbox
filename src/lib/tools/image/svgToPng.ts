export async function svgToPng(file: File, width?: number, height?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const svgText = e.target?.result as string
      const parser = new DOMParser()
      const doc = parser.parseFromString(svgText, 'image/svg+xml')
      const svg = doc.documentElement

      const svgW = parseFloat(svg.getAttribute('width') ?? svg.getAttribute('viewBox')?.split(' ')[2] ?? '800')
      const svgH = parseFloat(svg.getAttribute('height') ?? svg.getAttribute('viewBox')?.split(' ')[3] ?? '600')
      const outW = width ?? svgW
      const outH = height ?? svgH

      const blob = new Blob([svgText], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = outW
        canvas.height = outH
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, outW, outH)
        ctx.drawImage(img, 0, 0, outW, outH)
        URL.revokeObjectURL(url)
        canvas.toBlob(
          blob2 => blob2 ? resolve(blob2) : reject(new Error('Conversion failed')),
          'image/png'
        )
      }
      img.onerror = () => reject(new Error('Failed to render SVG'))
      img.src = url
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
