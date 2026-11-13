// Request/response helpers for the conversion routes.
// Vercel caps request AND response bodies at 4.5 MB. Small files can be POSTed directly
// (multipart field "file" or a raw body). Larger files: upload them from the browser to
// Vercel Blob (client upload) and POST { "url": "<blob url>" } instead.

export const MAX_RESPONSE_BYTES = Number(process.env.MAX_RESPONSE_BYTES || 4.4 * 1024 * 1024);
const MAX_DOWNLOAD_BYTES = Number(process.env.MAX_DOWNLOAD_BYTES || 50 * 1024 * 1024);
// Direct uploads (multipart / raw body). On Vercel the platform already caps bodies at 4.5 MB; self-hosted
// (next start, STANDALONE) nothing else does, so cap them here too.
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024);
// {url} inputs: the whole download (connect + body) must finish within this many ms
const DOWNLOAD_TIMEOUT_MS = Number(process.env.DOWNLOAD_TIMEOUT_MS || 20000);
// Only fetch from known hosts (prevents the route being used to probe internal URLs).
const ALLOWED_HOSTS = (process.env.ALLOWED_INPUT_HOSTS || '.public.blob.vercel-storage.com')
  .split(',').map((s) => s.trim()).filter(Boolean);

function hostAllowed(u) {
  return ALLOWED_HOSTS.some((h) => {
    if (h.startsWith('.')) return u.protocol === 'https:' && u.hostname.endsWith(h);
    return u.host === h; // exact host[:port] entries, e.g. for local testing
  });
}

class TooLarge extends Error {}

/**
 * Read a body stream into one Uint8Array, refusing more than `max` bytes as soon as they arrive
 * (Content-Length is only a hint: it can be absent or wrong). Throws TooLarge.
 */
async function readCapped(body, max) {
  if (!body) return new Uint8Array(0);
  const reader = body.getReader();
  const parts = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) throw new TooLarge();
      parts.push(value);
    }
  } catch (e) {
    reader.cancel().catch(() => {});
    throw e;
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.byteLength; }
  return out;
}

const tooLarge = (max) => ({ error: `input file too large (limit ${Math.round(max / 1048576)} MB)`, status: 413 });
const declared = (req) => Number(req.headers.get('content-length') || 0);

export async function readInput(req) {
  const type = req.headers.get('content-type') || '';
  if (type.includes('multipart/form-data')) {
    // formData() buffers the whole body, so check what the client declares first (the multipart envelope
    // adds a little; chunked uploads without a length are bounded by the file size check below)
    if (declared(req) > MAX_UPLOAD_BYTES + 64 * 1024) return tooLarge(MAX_UPLOAD_BYTES);
    let form;
    try { form = await req.formData(); } catch { return { error: 'could not read the multipart body', status: 400 }; }
    const file = form.get('file');
    if (!file || typeof file === 'string') return { error: 'multipart field "file" is missing', status: 400 };
    if (file.size > MAX_UPLOAD_BYTES) return tooLarge(MAX_UPLOAD_BYTES);
    return { bytes: new Uint8Array(await file.arrayBuffer()), name: file.name || 'document' };
  }
  if (type.includes('application/json')) {
    let u;
    try {
      if (declared(req) > 64 * 1024) throw new Error('too long');
      const body = await req.json();
      u = new URL(body.url);
    } catch {
      return { error: 'JSON body must be { "url": "https://..." }', status: 400 };
    }
    if (!hostAllowed(u)) return { error: `input host not allowed: ${u.host}`, status: 403 };
    let r;
    const signal = AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS);
    try {
      r = await fetch(u, { redirect: 'error', signal });
    } catch (e) {
      return e?.name === 'TimeoutError' ? { error: 'timed out fetching the input', status: 504 } : { error: 'could not fetch input', status: 502 };
    }
    if (!r.ok) { r.body?.cancel().catch(() => {}); return { error: `could not fetch input (${r.status})`, status: 502 }; }
    if (Number(r.headers.get('content-length') || 0) > MAX_DOWNLOAD_BYTES) { r.body?.cancel().catch(() => {}); return tooLarge(MAX_DOWNLOAD_BYTES); }
    let bytes;
    try {
      // streamed with a hard cap: a missing or lying Content-Length can't make us buffer more than the limit,
      // and the timeout signal also covers a body that trickles in
      bytes = await readCapped(r.body, MAX_DOWNLOAD_BYTES);
    } catch (e) {
      if (e instanceof TooLarge) return tooLarge(MAX_DOWNLOAD_BYTES);
      return e?.name === 'TimeoutError' || signal.aborted ? { error: 'timed out fetching the input', status: 504 } : { error: 'could not fetch input', status: 502 };
    }
    let name = 'document';
    try { name = decodeURIComponent(u.pathname.split('/').pop() || 'document'); } catch { /* malformed %-escape: keep the default */ }
    return { bytes, name };
  }
  if (declared(req) > MAX_UPLOAD_BYTES) return tooLarge(MAX_UPLOAD_BYTES);
  let bytes;
  try {
    bytes = await readCapped(req.body, MAX_UPLOAD_BYTES);
  } catch (e) {
    if (e instanceof TooLarge) return tooLarge(MAX_UPLOAD_BYTES);
    return { error: 'could not read the request body', status: 400 };
  }
  if (!bytes.length) return { error: 'empty request body', status: 400 };
  return { bytes, name: req.headers.get('x-filename') || 'document' };
}

/**
 * RFC 5987 ext-value for filename*: percent-encode everything but attr-chars. encodeURIComponent() leaves
 * ' ( ) * ! unencoded (not attr-chars) and throws URIError on lone surrogates, so those are handled here.
 */
function rfc5987(s) {
  const wellFormed = String(s).replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
  return encodeURIComponent(wellFormed).replace(/['()*!]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function fileResponse(bytes, { type, name, ext, extraHeaders = {} }) {
  if (bytes.length > MAX_RESPONSE_BYTES) {
    return Response.json({
      error: `converted file is ${(bytes.length / 1048576).toFixed(1)} MB; Vercel responses are limited to 4.5 MB`,
      hint: 'convert this file in the browser with the same library, or upload the result to Vercel Blob',
    }, { status: 413 });
  }
  // the name is client input: keep it to one line and a sane length before it goes into a header
  const base = String(name).replace(/[\x00-\x1f\x7f]/g, '').replace(/\.[^.]+$/, '').slice(0, 200) || 'document';
  const ascii = base.replace(/[^\x20-\x7e]|["\\]/g, '_');
  const safeExt = String(ext).replace(/[^a-z0-9]/gi, '');
  return new Response(bytes, {
    headers: {
      'content-type': type,
      'content-disposition': `attachment; filename="${ascii}.${safeExt}"; filename*=UTF-8''${rfc5987(base)}.${safeExt}`,
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

export const isZip = (b) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
export const isPdf = (b) => b.length > 5 && String.fromCharCode(...b.subarray(0, 1024).slice(0, 1024)).includes('%PDF-');
