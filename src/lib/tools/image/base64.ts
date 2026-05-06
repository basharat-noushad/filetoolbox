export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function base64ToImage(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}
