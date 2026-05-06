export async function heicToJpg(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
  return Array.isArray(result) ? result[0] : result
}
