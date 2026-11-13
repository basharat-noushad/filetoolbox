import ImageTracer from 'imagetracerjs'

export type VectorPreset = 'logo' | 'illustration' | 'detailed' | 'bw'

export const PRESETS: Record<VectorPreset, { label: string; hint: string; opts: Record<string, unknown> }> = {
  logo: { label: 'Logo / icon', hint: '6 colors, smooth shapes', opts: { numberofcolors: 6, pathomit: 12, ltres: 1, qtres: 1, blurradius: 1, blurdelta: 20 } },
  illustration: { label: 'Illustration', hint: '16 colors', opts: { numberofcolors: 16, pathomit: 8 } },
  detailed: { label: 'Detailed', hint: '32 colors, finer paths (larger file)', opts: { numberofcolors: 32, pathomit: 2, ltres: 0.5, qtres: 0.5 } },
  bw: { label: 'Black & white', hint: '2 colors, for line art and silhouettes', opts: { numberofcolors: 2, colorsampling: 0, pathomit: 8 } },
}

export interface TraceRequest {
  imageData: ImageData
  preset: VectorPreset
  /** original width / traced width, so the SVG renders at original size */
  scale: number
}

export function traceImageData({ imageData, preset, scale }: TraceRequest): string {
  return ImageTracer.imagedataToSVG(imageData, { ...PRESETS[preset].opts, scale, viewbox: true, roundcoords: 1 })
}
