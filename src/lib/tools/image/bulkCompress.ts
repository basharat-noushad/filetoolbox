import imageCompression from 'browser-image-compression'
import JSZip from 'jszip'

export async function bulkCompressImages(files: File[], maxSizeMB = 1): Promise<Blob> {
  const zip = new JSZip()
  await Promise.all(files.map(async (file) => {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    })
    const ext = file.name.split('.').pop() ?? 'jpg'
    const baseName = file.name.replace(/\.[^.]+$/, '')
    zip.file(`${baseName}_compressed.${ext}`, compressed)
  }))
  return zip.generateAsync({ type: 'blob' })
}
