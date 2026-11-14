import { getFFmpeg } from './ffmpegConvert'
import { fetchFile } from '@ffmpeg/util'

export const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // same recommendation as mp4-to-gif
export class NoAudioError extends Error {}


export async function mp4ToMp3(file: File, kbps: 128 | 192 | 320, onProgress?: (ratio: number) => void): Promise<Blob> {
  const ff = await getFFmpeg()
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4'
  const input = `input.${ext}`
  const logs: string[] = []
  const onLog = ({ message }: { message: string }) => { logs.push(message) }
  const onProg = ({ progress }: { progress: number }) => onProgress?.(Math.max(0, Math.min(1, progress)))
  ff.on('log', onLog); ff.on('progress', onProg)
  try {
    await ff.writeFile(input, await fetchFile(file))
    const code = await ff.exec(['-y', '-i', input, '-vn', '-map', '0:a:0?', '-c:a', 'libmp3lame', '-b:a', `${kbps}k`, 'output.mp3'])
    if (!logs.some(l => /Stream #\d+:\d+.*Audio:/.test(l))) throw new NoAudioError('no audio')
    if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`)
    const data = await ff.readFile('output.mp3') as Uint8Array
    return new Blob([data.slice().buffer as ArrayBuffer], { type: 'audio/mpeg' })
  } finally {
    ff.off('log', onLog); ff.off('progress', onProg)
    await ff.deleteFile(input).catch(() => {})
    await ff.deleteFile('output.mp3').catch(() => {})
  }
}
