import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg
  ffmpeg = new FFmpeg()
  await ffmpeg.load({
    coreURL: '/ffmpeg/ffmpeg-core.js',
    wasmURL: '/ffmpeg/ffmpeg-core.wasm',
  })
  return ffmpeg
}

export async function gifToMp4(file: File): Promise<Blob> {
  const ff = await getFFmpeg()
  await ff.writeFile('input.gif', await fetchFile(file))
  await ff.exec(['-i', 'input.gif', '-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', 'output.mp4'])
  const data = await ff.readFile('output.mp4') as Uint8Array
  return new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' })
}

export async function mp4ToGif(file: File): Promise<Blob> {
  const ff = await getFFmpeg()
  await ff.writeFile('input.mp4', await fetchFile(file))
  await ff.exec(['-i', 'input.mp4', '-vf', 'fps=10,scale=480:-1:flags=lanczos', '-loop', '0', 'output.gif'])
  const data = await ff.readFile('output.gif') as Uint8Array
  return new Blob([data.buffer as ArrayBuffer], { type: 'image/gif' })
}
