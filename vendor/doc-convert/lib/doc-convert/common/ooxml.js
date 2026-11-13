// Shared OOXML package access (zip parts + relationships), used by the Word, Excel and PowerPoint readers.
import { strFromU8 } from 'fflate';
import { inflateBounded } from './inflate.js';
import { DEFAULT_LIMITS, LimitError } from './limits.js';
import { parseXml, descendants, attr } from './xml.js';

// ---------------------------------------------------------------- package --
// The zip is read by hand (central directory, or local headers when that is damaged) so that parts can be
// inflated lazily - a part nobody references is never decompressed - and so that every inflate is bounded
// by the bytes it actually produces (see common/inflate.js), not by the sizes the zip declares.
const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const EOCD = 0x06054b50;
function findSig(u8, from) {
  for (let i = from; i + 3 < u8.length; i++) {
    if (u8[i] === 0x50 && u8[i + 1] === 0x4b && ((u8[i + 2] === 3 && u8[i + 3] === 4) || (u8[i + 2] === 1 && u8[i + 3] === 2) || (u8[i + 2] === 7 && u8[i + 3] === 8))) return i;
  }
  return u8.length;
}
const entryName = (u8, p, len, utf8) => strFromU8(u8.subarray(p, Math.min(u8.length, p + len)), !utf8);

/**
 * Entries listed in the central directory: Map name -> { method, start, csize } (start = first data byte).
 * Throws when there is no readable central directory (caller falls back to the local headers).
 */
function readCentralDirectory(u8, dv, limits) {
  let e = u8.length - 22;
  const stop = Math.max(0, u8.length - 65557);
  while (e >= stop && dv.getUint32(e, true) !== EOCD) e--;
  if (e < stop) throw new Error('invalid zip data (no end of central directory)');
  let count = dv.getUint16(e + 10, true);
  let o = dv.getUint32(e + 16, true);
  // zip64: the EOCD locator sits 20 bytes before the EOCD record
  if (e >= 20 && dv.getUint32(e - 20, true) === 0x07064b50) {
    const ze = Number(dv.getBigUint64(e - 12, true));
    if (ze + 56 <= u8.length && dv.getUint32(ze, true) === 0x06064b50) {
      count = Number(dv.getBigUint64(ze + 32, true));
      o = Number(dv.getBigUint64(ze + 48, true));
    }
  }
  if (count > limits.maxZipEntries) throw new LimitError(`the file has more than ${limits.maxZipEntries} zip entries`);
  const out = new Map();
  for (let i = 0; i < count; i++) {
    if (o + 46 > u8.length || dv.getUint32(o, true) !== CENTRAL) throw new Error('invalid zip data (bad central directory)');
    const flags = dv.getUint16(o + 8, true);
    const method = dv.getUint16(o + 10, true);
    let csize = dv.getUint32(o + 20, true);
    const nlen = dv.getUint16(o + 28, true);
    const xlen = dv.getUint16(o + 30, true);
    const clen = dv.getUint16(o + 32, true);
    let off = dv.getUint32(o + 42, true);
    const name = entryName(u8, o + 46, nlen, flags & 0x800);
    // zip64 extra field (id 1): uncompressed, compressed, offset - each present only if the 32-bit field is ~0
    if (csize === 0xffffffff || off === 0xffffffff) {
      for (let x = o + 46 + nlen; x + 4 <= Math.min(u8.length, o + 46 + nlen + xlen);) {
        const id = dv.getUint16(x, true);
        const sz = dv.getUint16(x + 2, true);
        if (id === 1) {
          let q = x + 4;
          if (dv.getUint32(o + 24, true) === 0xffffffff) q += 8;
          if (csize === 0xffffffff && q + 8 <= u8.length) { csize = Number(dv.getBigUint64(q, true)); q += 8; }
          if (off === 0xffffffff && q + 8 <= u8.length) off = Number(dv.getBigUint64(q, true));
          break;
        }
        x += 4 + sz;
      }
    }
    o += 46 + nlen + xlen + clen;
    if (off + 30 > u8.length) continue; // damaged entry: skip it (bin() may still find it in the local headers)
    const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
    out.set(name, { method, start, csize });
  }
  return out;
}

/**
 * Read a damaged zip (truncated, or missing its central directory) from its local file headers, the way
 * Office's "repair" does. Returns the same Map shape as readCentralDirectory; nothing is inflated here.
 */
function scanLocalHeaders(u8, dv, limits) {
  const out = new Map();
  let p = 0;
  while (p + 30 <= u8.length) {
    if (dv.getUint32(p, true) !== LOCAL) {
      const n = findSig(u8, p + 1);
      if (n >= u8.length || dv.getUint32(n, true) !== LOCAL) {
        // skip descriptors/central entries until the next local header (or the end)
        let q = n + 4;
        while (q < u8.length && !(q + 4 <= u8.length && dv.getUint32(q, true) === LOCAL)) q = findSig(u8, q + 1);
        if (q >= u8.length) break;
        p = q;
      } else p = n;
      continue;
    }
    const flags = dv.getUint16(p + 6, true);
    const method = dv.getUint16(p + 8, true);
    let csize = dv.getUint32(p + 18, true);
    const nlen = dv.getUint16(p + 26, true);
    const xlen = dv.getUint16(p + 28, true);
    const name = entryName(u8, p + 30, nlen, flags & 0x800);
    const start = p + 30 + nlen + xlen;
    if ((flags & 8) && csize === 0) csize = findSig(u8, start) - start;
    if (out.size >= limits.maxZipEntries) throw new LimitError(`the file has more than ${limits.maxZipEntries} zip entries`);
    out.set(name, { method, start, csize });
    p = Math.max(start + csize, p + 1);
  }
  return out;
}

export function openPackage(bytes, limits = DEFAULT_LIMITS) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let entries;
  let local = null; // local-header index, built only if needed
  const localIndex = () => (local ??= u8[0] === 0x50 && u8[1] === 0x4b ? scanLocalHeaders(u8, dv, limits) : new Map());
  try {
    entries = readCentralDirectory(u8, dv, limits);
  } catch (e) {
    if (e instanceof LimitError) throw e;
    entries = localIndex();
    if (!entries.size) throw new Error(`Not a readable Office file (${e.message})`);
  }
  // inflated parts, keyed by name. A Map, not a plain object: part names are attacker-chosen ('__proto__' ...)
  const cache = new Map();
  let inflated = 0; // bytes inflated so far in this package, against limits.maxZipTotalBytes
  const decode = (ent, name) => {
    const data = u8.subarray(ent.start, Math.min(u8.length, ent.start + ent.csize));
    const room = Math.min(limits.maxZipEntryBytes, limits.maxZipTotalBytes - inflated);
    let out;
    if (ent.method === 0) {
      if (data.length > room) throw new LimitError(`part ${name} is larger than the ${Math.round(limits.maxZipEntryBytes / 1048576)} MB limit`);
      out = data.slice();
    } else if (ent.method === 8) {
      // the message says which limit was hit: one part, or the whole package
      const what = room < limits.maxZipEntryBytes ? 'the package (all parts together)' : `part ${name}`;
      out = inflateBounded(data, room, what);
    } else return null; // unsupported compression method
    inflated += out.length;
    return out;
  };
  const read = (name) => {
    if (cache.has(name)) return cache.get(name);
    let out = null;
    const ent = entries.get(name);
    if (ent) {
      try { out = decode(ent, name); } catch (e) {
        if (e instanceof LimitError) throw e;
        out = null; // damaged entry: try its local header below
      }
    }
    if (!out && entries !== local) {
      const alt = localIndex().get(name);
      if (alt && (!ent || alt.start !== ent.start)) {
        try { out = decode(alt, name); } catch (e) { if (e instanceof LimitError) throw e; out = null; }
      }
    }
    cache.set(name, out);
    return out;
  };
  const norm = (p) => {
    const out = [];
    for (const seg of p.replace(/^\//, '').split('/')) {
      if (seg === '..') out.pop();
      else if (seg && seg !== '.') out.push(seg);
    }
    return out.join('/');
  };
  const bin = (p) => read(norm(String(p ?? '')));
  const text = (p) => { const b = bin(p); return b ? strFromU8(b) : null; };
  // a part that parses to no root element is as good as missing (callers read doc.documentElement)
  const xml = (p) => { const t = text(p); const d = t ? parseXml(t) : null; return d?.documentElement ? d : null; };
  function rels(partPath) {
    const dir = partPath.includes('/') ? partPath.slice(0, partPath.lastIndexOf('/') + 1) : '';
    const name = partPath.slice(dir.length);
    const doc = xml(`${dir}_rels/${name}.rels`);
    const map = new Map();
    if (!doc) return map;
    for (const r of descendants(doc.documentElement, 'Relationship')) {
      const target = attr(r, 'Target');
      if (!target) continue; // damaged relationship
      const external = attr(r, 'TargetMode') === 'External';
      map.set(attr(r, 'Id'), {
        type: attr(r, 'Type') || '',
        target: external ? target : norm(target.startsWith('/') ? target : dir + target),
        external,
      });
    }
    return map;
  }
  const rootRels = rels('');
  let main = 'word/document.xml';
  for (const r of rootRels.values()) if (r.type.endsWith('/officeDocument')) main = r.target;
  return { bin, text, xml, rels, main, limits };
}

