import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

let loading: Promise<FFmpeg> | null = null

function getFFmpeg(): Promise<FFmpeg> {
  if (!loading) {
    loading = (async () => {
      const ff = new FFmpeg()
      // Absolute URLs: the bundler runs ffmpeg's worker from a blob: URL, where root-relative paths don't resolve.
      await ff.load({
        coreURL: new URL('/ffmpeg/ffmpeg-core.js', location.origin).href,
        wasmURL: new URL('/ffmpeg/ffmpeg-core.wasm', location.origin).href,
      })
      return ff
    })().catch(err => { loading = null; throw err }) // don't cache a failed load
  }
  return loading
}

async function convert(file: File, input: string, output: string, args: string[], type: string): Promise<Blob> {
  const ff = await getFFmpeg()
  try {
    await ff.writeFile(input, await fetchFile(file))
    const code = await ff.exec(['-y', '-i', input, ...args, output])
    if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`)
    const data = await ff.readFile(output) as Uint8Array
    return new Blob([data.slice().buffer as ArrayBuffer], { type })
  } finally {
    await ff.deleteFile(input).catch(() => {})
    await ff.deleteFile(output).catch(() => {})
  }
}

export function gifToMp4(file: File): Promise<Blob> {
  return convert(file, 'input.gif', 'output.mp4',
    ['-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'], 'video/mp4')
}

export function mp4ToGif(file: File): Promise<Blob> {
  return convert(file, 'input.mp4', 'output.gif',
    ['-vf', 'fps=10,scale=480:-1:flags=lanczos', '-loop', '0'], 'image/gif')
}
