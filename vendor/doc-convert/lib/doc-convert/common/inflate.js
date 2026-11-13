// Size-bounded raw DEFLATE decoding on top of fflate's streaming Inflate.
//
// Why not inflateSync(data, { out: new Uint8Array(declaredSize) })? fflate trusts the buffer it is given:
// it allocates the declared size up front and silently truncates if the real output is larger (verified
// with fflate 0.8.3). Declared sizes in zips and PNGs are attacker-controlled, so instead the compressed
// input is fed in small slices and the bytes actually produced are counted; decoding stops as soon as the
// count passes the cap. DEFLATE expands at most ~1032:1, so one 16 KB slice yields at most ~17 MB before
// the check runs again.
import { Inflate } from 'fflate';
import { LimitError } from './limits.js';

const SLICE = 16 * 1024;

/**
 * Run a raw DEFLATE stream through `onData(chunk)` without ever holding more than one slice's output.
 * Throws LimitError (with `what` in the message) when more than `max` bytes come out, and fflate's error on
 * corrupt or truncated data. Returns the number of bytes produced.
 */
export function inflateStream(data, max, onData, what = 'compressed data') {
  let total = 0;
  const inf = new Inflate((chunk) => {
    total += chunk.length;
    if (total > max) throw new LimitError(`${what} inflates to more than ${Math.round(max / 1048576)} MB`);
    if (chunk.length) onData(chunk);
  });
  if (!data.length) { inf.push(data, true); return total; }
  for (let i = 0; i < data.length; i += SLICE) inf.push(data.subarray(i, i + SLICE), i + SLICE >= data.length);
  return total;
}

/** inflate raw DEFLATE data into one Uint8Array of at most `max` bytes (LimitError beyond that) */
export function inflateBounded(data, max, what) {
  const parts = [];
  const total = inflateStream(data, max, (c) => parts.push(c), what);
  if (parts.length === 1) return parts[0];
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
