// Units + DPI metadata. Writes print density into canvas output bytes.
// JPEG: JFIF APP0 (units=1, dpi). PNG: pHYs chunk (pixels per metre). WebP: not supported (left untouched).
export type Unit = 'px' | 'cm' | 'mm' | 'in'
export const UNITS: Unit[] = ['px', 'cm', 'mm', 'in']
const PER_INCH: Record<Exclude<Unit, 'px'>, number> = { in: 1, cm: 2.54, mm: 25.4 }

/** Value in `unit` -> pixels (round(inches * dpi) for physical units). */
export function toPx(value: number, unit: Unit, dpi: number): number {
  return unit === 'px' ? Math.round(value) : Math.round((value / PER_INCH[unit]) * dpi)
}
/** Convert a value between units (px needs dpi). */
export function convertUnit(value: number, from: Unit, to: Unit, dpi: number): number {
  if (from === to) return value
  const inches = from === 'px' ? value / dpi : value / PER_INCH[from]
  return to === 'px' ? inches * dpi : inches * PER_INCH[to]
}
export const fmtUnit = (v: number, unit: Unit) => String(unit === 'px' ? Math.round(v) : Math.round(v * 100) / 100)

let crcTable: Uint32Array | null = null
function crc32(buf: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0 }
  }
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export function patchDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  const d = Math.round(dpi)
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const out = bytes.slice()
    const isJfif = out[2] === 0xff && out[3] === 0xe0 && out[6] === 0x4a && out[7] === 0x46 && out[8] === 0x49 && out[9] === 0x46
    if (isJfif) { out.set([1, d >> 8, d & 255, d >> 8, d & 255], 13); return out } // units, Xdens, Ydens
    const app0 = [0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 1, d >> 8, d & 255, d >> 8, d & 255, 0, 0]
    const res = new Uint8Array(bytes.length + app0.length)
    res.set(bytes.subarray(0, 2)); res.set(app0, 2); res.set(bytes.subarray(2), 2 + app0.length)
    return res
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    const ppm = Math.round(d / 0.0254)
    const chunk = new Uint8Array(21) // len(4) 'pHYs' data(9) crc(4)
    const dv = new DataView(chunk.buffer)
    dv.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4)
    dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1
    dv.setUint32(17, crc32(chunk.subarray(4, 17)))
    // drop an existing pHYs, insert ours right after IHDR (8 signature + 25 IHDR)
    const parts: Uint8Array[] = [bytes.subarray(0, 33), chunk]
    let p = 33
    while (p + 12 <= bytes.length) {
      const len = new DataView(bytes.buffer, bytes.byteOffset + p).getUint32(0)
      const isPhys = bytes[p + 4] === 0x70 && bytes[p + 5] === 0x48 && bytes[p + 6] === 0x59 && bytes[p + 7] === 0x73
      if (!isPhys) parts.push(bytes.subarray(p, p + 12 + len))
      p += 12 + len
    }
    const out = new Uint8Array(parts.reduce((a, b) => a + b.length, 0)); let o = 0
    for (const b of parts) { out.set(b, o); o += b.length }
    return out
  }
  return bytes // WebP etc: unsupported
}

export async function setBlobDpi(blob: Blob, dpi: number): Promise<Blob> {
  const out = patchDpi(new Uint8Array(await blob.arrayBuffer()), dpi)
  return new Blob([out as BlobPart], { type: blob.type })
}

/** Read density back (dpi) from JPEG/PNG bytes, or null. Used by the self-check. */
export function readDpi(b: Uint8Array): number | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[6] === 0x4a && b[13] === 1) return (b[14] << 8) | b[15]
  if (b[0] === 0x89) {
    let p = 8
    while (p + 12 <= b.length) {
      const dv = new DataView(b.buffer, b.byteOffset + p); const len = dv.getUint32(0)
      if (b[p + 4] === 0x70 && b[p + 5] === 0x48 && b[p + 6] === 0x59 && b[p + 7] === 0x73) return Math.round(dv.getUint32(8) * 0.0254)
      p += 12 + len
    }
  }
  return null
}

/** Self-check: run in node/browser. Throws if broken. */
export function selfCheck() {
  if (toPx(35, 'mm', 300) !== 413 || toPx(45, 'mm', 300) !== 531 || toPx(2, 'in', 300) !== 600) throw new Error('toPx')
  const jfif = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9])
  if (readDpi(patchDpi(jfif, 300)) !== 300) throw new Error('jfif')
  if (readDpi(patchDpi(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 300)) !== 300) throw new Error('jpeg insert')
}
