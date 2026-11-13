// Pre-flight check for OLE2 compound files (.doc/.xls/.ppt) before cfb parses them.
//
// cfb's CFB.read() copies every stream out of the container (`sector chain data.slice(0, size)`), and it
// caches chains by start sector, so N directory entries that all point at the same 2 MB chain cost N x 2 MB:
// a 2.4 MB file with 2000 such entries took a test process past 4 GB. Legitimate files never share sectors,
// so the sum of their stream sizes is at most the file size. This walks the directory (header -> FAT ->
// directory chain) and adds up what cfb would copy; above limits.maxOleStreamBytes it refuses the file.
// Anything structurally odd is left for cfb to report: this check only bounds memory.
import { DEFAULT_LIMITS, LimitError } from './limits.js';

const FREE = 0xfffffffa; // sector ids >= this are special (end of chain, free, FAT, DIFAT)

export function checkOle(u8, limits = DEFAULT_LIMITS) {
  if (u8.length < 512) return;
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const shift = dv.getUint16(0x1e, true);
  if (shift !== 9 && shift !== 12) return;
  const ssz = 1 << shift;
  const perSector = ssz / 4;
  const sectors = Math.floor((u8.length - ssz) / ssz) + 1; // incl. a partial last sector
  const at = (s) => (s + 1) * ssz;
  // FAT sector ids: 109 in the header, the rest in the DIFAT chain
  const fatIds = [];
  for (let i = 0; i < 109; i++) { const s = dv.getUint32(0x4c + i * 4, true); if (s < FREE) fatIds.push(s); }
  let difat = dv.getUint32(0x44, true);
  for (let guard = 0; difat < FREE && difat < sectors && guard < sectors; guard++) {
    const o = at(difat);
    for (let i = 0; i < perSector - 1 && o + i * 4 + 4 <= u8.length; i++) { const s = dv.getUint32(o + i * 4, true); if (s < FREE) fatIds.push(s); }
    difat = o + ssz <= u8.length ? dv.getUint32(o + ssz - 4, true) : FREE;
  }
  const next = (s) => {
    const f = fatIds[Math.floor(s / perSector)];
    if (f === undefined || f >= sectors) return FREE;
    const o = at(f) + (s % perSector) * 4;
    return o + 4 <= u8.length ? dv.getUint32(o, true) : FREE;
  };
  // walk the directory chain (cycle-safe) and sum the stream sizes cfb will copy
  let total = 0;
  const seen = new Set();
  for (let s = dv.getUint32(0x30, true); s < FREE && s < sectors && !seen.has(s); s = next(s)) {
    seen.add(s);
    const o = at(s);
    for (let e = o; e + 128 <= Math.min(u8.length, o + ssz); e += 128) {
      if (u8[e + 66] !== 2) continue; // not a stream
      // a stream can't hold more than the file has; cfb slices to the size, so count min(size, file)
      total += Math.min(dv.getUint32(e + 120, true) + (shift === 12 ? dv.getUint32(e + 124, true) * 2 ** 32 : 0), u8.length);
      if (total > limits.maxOleStreamBytes) {
        throw new LimitError(`the file's streams add up to more than ${Math.round(limits.maxOleStreamBytes / 1048576)} MB`);
      }
    }
  }
}
