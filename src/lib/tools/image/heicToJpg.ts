export async function heicToJpg(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
  return Array.isArray(result) ? result[0] : result
}

/** Convert files one at a time (heic2any is memory-heavy); returns a single JPG or a ZIP. */
export async function heicBatchToJpg(files: File[], onProgress?: (done: number) => void): Promise<{ blob: Blob; filename: string }> {
  const base = (f: File) => f.name.replace(/\.[^.]+$/, '') || 'image'
  if (files.length === 1) {
    const blob = await heicToJpg(files[0])
    onProgress?.(1)
    return { blob, filename: `${base(files[0])}.jpg` }
  }
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const used = new Set<string>()
  for (let i = 0; i < files.length; i++) {
    let name = base(files[i]); let n = 1
    while (used.has(name)) name = `${base(files[i])}-${++n}`
    used.add(name)
    zip.file(`${name}.jpg`, await heicToJpg(files[i]))
    onProgress?.(i + 1)
  }
  return { blob: await zip.generateAsync({ type: 'blob' }), filename: 'heic-to-jpg.zip' }
}
