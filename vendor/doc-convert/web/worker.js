// doc-convert browser worker: every conversion runs here, off the main thread, and files never leave the device.
// Converters and pdf.js are separate chunks fetched on first use; fonts are fetched once per face and cached.
// Expects this layout next to worker.js (made by `npm run build:browser`):
//   chunks/  fonts/*.ttf  pdfjs/wasm/*  pdfjs/cmaps/*
import { convert, detectFormat, CONVERSIONS, LABELS } from '../lib/doc-convert/index.js';

const FILES = {
  Carlito: ['Carlito-Regular', 'Carlito-Bold', 'Carlito-Italic', 'Carlito-BoldItalic'],
  Caladea: ['Caladea-Regular', 'Caladea-Bold', 'Caladea-Italic', 'Caladea-BoldItalic'],
  'Liberation Sans': ['LiberationSans-Regular', 'LiberationSans-Bold', 'LiberationSans-Italic', 'LiberationSans-BoldItalic'],
  'Liberation Serif': ['LiberationSerif-Regular', 'LiberationSerif-Bold', 'LiberationSerif-Italic', 'LiberationSerif-BoldItalic'],
  'Liberation Mono': ['LiberationMono-Regular', 'LiberationMono-Bold', 'LiberationMono-Italic', 'LiberationMono-BoldItalic'],
  'DejaVu Sans': ['DejaVuSans', 'DejaVuSans-Bold', 'DejaVuSans-Oblique', 'DejaVuSans-BoldOblique'],
};
let fontBase = new URL('./fonts/', import.meta.url).href;
const fontCache = new Map();
function fontProvider(family, bold, italic) {
  const f = FILES[family]?.[(bold ? 1 : 0) + (italic ? 2 : 0)];
  if (!f) return null;
  if (!fontCache.has(f)) {
    const p = fetch(new URL(`${f}.ttf`, fontBase))
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => (b ? new Uint8Array(b) : null))
      .catch(() => null);
    p.then((v) => { if (!v) fontCache.delete(f); }); // retry next time after a network error
    fontCache.set(f, p);
  }
  return fontCache.get(f);
}

// pdf.js's own loader looks at `document`, which workers don't have; fetch its data files directly.
class FetchDataFactory {
  constructor({ cMapUrl = null, standardFontDataUrl = null, wasmUrl = null } = {}) {
    Object.assign(this, { cMapUrl, standardFontDataUrl, wasmUrl });
  }
  async fetch({ kind, filename }) {
    const base = this[kind];
    if (!base) throw new Error(`Ensure that the \`${kind}\` API parameter is provided.`);
    const res = await fetch(base + filename);
    if (!res.ok) throw new Error(`Unable to load ${base}${filename}`);
    return new Uint8Array(await res.arrayBuffer());
  }
}
const PDFJS_ASSETS = new URL('./pdfjs/', import.meta.url).href;
const pdfOptions = {
  BinaryDataFactory: FetchDataFactory,
  wasmUrl: `${PDFJS_ASSETS}wasm/`, // CCITT fax / JBIG2 (scans) and JPEG 2000 image decoders
  cMapUrl: `${PDFJS_ASSETS}cmaps/`, // CJK text encodings
  cMapPacked: true,
};

let pdfjsReady = null;
function loadPdfjs() {
  // pdf.js normally starts its own worker; we are already in one, so run its worker code in this thread
  pdfjsReady ||= Promise.all([import('pdfjs-dist/build/pdf.mjs'), import('pdfjs-dist/build/pdf.worker.mjs')]).then(([lib, worker]) => {
    globalThis.pdfjsWorker = worker;
    return lib;
  });
  return pdfjsReady;
}

// OCR runs on the page (options.ocr: true): each scanned page goes out as { id, type: 'ocr', reqId, image } and
// comes back as { type: 'ocr-result', reqId, result } or { type: 'ocr-result', reqId, error }
let ocrSeq = 0;
const ocrWaiting = new Map(); // reqId -> { resolve, reject }
const pageOcr = (id) => (image) => new Promise((resolve, reject) => {
  const reqId = ++ocrSeq;
  ocrWaiting.set(reqId, { resolve, reject });
  const bytes = image.bytes.byteOffset === 0 && image.bytes.byteLength === image.bytes.buffer.byteLength ? image.bytes : image.bytes.slice();
  self.postMessage({ id, type: 'ocr', reqId, image: { ...image, bytes } }, [bytes.buffer]);
});

self.onmessage = async (e) => {
  if (e.data?.type === 'ocr-result') {
    const { reqId, result, error } = e.data;
    const w = ocrWaiting.get(reqId);
    ocrWaiting.delete(reqId);
    if (error !== undefined) w?.reject(new Error(String(error)));
    else w?.resolve(result ?? null);
    return;
  }
  const { id, op = 'convert', bytes, to, filename, options = {} } = e.data || {};
  if (id === undefined) return; // not ours (pdf.js's in-thread worker shares this message port)
  try {
    if (options.fontBase) fontBase = new URL(options.fontBase, self.location.href).href;
    const u8 = new Uint8Array(bytes);
    const from = detectFormat(u8, filename);
    if (op === 'detect') {
      self.postMessage({ id, ok: true, from, label: LABELS[from] || null, targets: CONVERSIONS[from] || [] });
      return;
    }
    const pdfjs = from === 'pdf' ? await loadPdfjs() : null;
    const r = await convert(u8, {
      to, filename, fontProvider, pdfjs, pdfOptions, maxPages: options.maxPages, limits: options.limits,
      ...(options.ocr ? {
        ocr: pageOcr(id),
        onProgress: ({ stage, page, pages }) => self.postMessage({ id, type: 'progress', stage, page, pages }),
      } : {}),
    });
    const out = r.data.byteOffset === 0 && r.data.buffer.byteLength === r.data.byteLength ? r.data.buffer : r.data.slice().buffer;
    self.postMessage({ id, ok: true, data: out, ext: r.ext, mime: r.mime, from: r.from, to: r.to, pages: r.pages ?? r.stats?.pages ?? null, stats: r.stats ?? null }, [out]);
  } catch (err) {
    // message: shown to users; detail: technical text (ConvertError.detail) for the console/logs only
    self.postMessage({ id, ok: false, code: err?.code || 'failed', message: String(err?.message || err), detail: err?.detail ?? (err?.code ? undefined : String(err?.stack || err)) });
  }
};
