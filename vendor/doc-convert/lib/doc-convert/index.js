// doc-convert: one entry point for every conversion. Pure JavaScript, runs in Node and in browsers.
//
//   const { data, ext, mime } = await convert(bytes, { to: 'pdf', fontProvider, pdfjs });
//
// Converters load on demand (dynamic import), so a bundler splits them into separate chunks and a browser
// only downloads the one a file needs. Environment specifics are injected: fontProvider(family, bold, italic)
// returns font bytes; pdfjs is the pdf.js module (needed only when the input is a PDF).
import { unzipSync } from 'fflate';
import { resolveLimits } from './common/limits.js';

export { DEFAULT_LIMITS, LimitError } from './common/limits.js';

export const MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
};

/** what each input format can become */
export const CONVERSIONS = {
  pdf: ['docx', 'xlsx', 'pptx'],
  docx: ['pdf'],
  doc: ['pdf', 'docx'],
  xlsx: ['pdf'],
  xls: ['pdf'],
  pptx: ['pdf'],
  ppt: ['pdf'],
};

export const LABELS = { pdf: 'PDF', docx: 'Word', doc: 'Word 97-2003', xlsx: 'Excel', xls: 'Excel 97-2003', pptx: 'PowerPoint', ppt: 'PowerPoint 97-2003' };

/**
 * Every error convert() throws. `code` is one of: 'empty', 'unsupported', 'unsupported-target', 'encrypted',
 * 'damaged', 'too-large', 'setup', 'cancelled' (browser client), 'failed'. `message` is plain text that can
 * be shown to end users; `detail` (when set) is the technical reason, for logs only, and `cause` the
 * original error.
 */
export class ConvertError extends Error {
  constructor(code, message, { detail, cause } = {}) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'ConvertError';
    this.code = code;
    if (detail !== undefined) this.detail = detail;
  }
}

// errors that mean "this file is broken", whatever the converter: malformed XML (xmldom ParseError),
// truncated binary structures (DataView/typed-array bounds), pdf.js's structural exceptions, and null/undefined
// dereferences on parts or records that a damaged file lacks
const DAMAGED_NAMES = new Set(['ParseError', 'DamagedError', 'InvalidPDFException', 'FormatError', 'MissingPDFException', 'UnexpectedResponseException', 'XRefEntryException', 'XRefParseException']);
const DAMAGED_TEXT = /not a (readable|word|powerpoint|excel)|damaged|invalid zip|unexpected EOF|invalid (block type|distance|length\/literal)|presentation\.xml is missing|no slides|no workbook|unsupported|invalid pdf|xml declaration|not well-formed|tag mismatch|missing root element|unclosed xml|unexpected end of|outside the bounds|out of (bounds|range)|offset is out|cannot read properties of (null|undefined)|is not iterable|invalid array length|invalid typed array length/i;
const isDamaged = (e, msg) => DAMAGED_NAMES.has(e?.name) || e?.code === 'damaged' || DAMAGED_TEXT.test(msg);

const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const startsWith = (b, sig) => sig.every((v, i) => b[i] === v);

/** OLE2 directory entry names (UTF-16) without parsing the whole container */
function oleNames(b) {
  const names = new Set();
  // the directory is made of 128-byte entries whose name is UTF-16LE; scanning the file for the few names
  // we care about is enough to tell Word, Excel and PowerPoint apart
  const want = ['WordDocument', 'Workbook', 'Book', 'PowerPoint Document', 'EncryptedPackage', 'EncryptionInfo', 'EncryptedSummary'];
  for (const w of want) {
    const pat = new Uint8Array(w.length * 2 + 2);
    for (let i = 0; i < w.length; i++) pat[i * 2] = w.charCodeAt(i);
    outer: for (let p = 512; p + pat.length <= b.length; p += 128) {
      for (let i = 0; i < pat.length; i++) if (b[p + i] !== pat[i]) continue outer;
      names.add(w);
      break;
    }
  }
  return names;
}

/** 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'doc' | 'xls' | 'ppt' | null */
export function detectFormat(bytes, filename = '') {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const ext = String(filename).toLowerCase().split('.').pop();
  // PDFs may have junk before the header (allowed in the first 1 KB)
  const head = String.fromCharCode(...b.subarray(0, Math.min(1024, b.length)));
  if (head.includes('%PDF-')) return 'pdf';
  if (b[0] === 0x50 && b[1] === 0x4b) {
    let names = [];
    try { unzipSync(b, { filter: (f) => { names.push(f.name); return false; } }); } catch { names = []; }
    if (names.some((n) => n.startsWith('word/'))) return 'docx';
    if (names.some((n) => n.startsWith('xl/'))) return 'xlsx';
    if (names.some((n) => n.startsWith('ppt/'))) return 'pptx';
    return ['docx', 'xlsx', 'pptx'].includes(ext) ? ext : null; // damaged zip: trust the name
  }
  if (startsWith(b, OLE)) {
    const n = oleNames(b);
    // EncryptedPackage/EncryptionInfo: password-protected .docx/.xlsx/.pptx; EncryptedSummary: protected .ppt
    if (n.has('EncryptedPackage') || n.has('EncryptionInfo') || n.has('EncryptedSummary')) return 'encrypted';
    if (n.has('WordDocument')) return 'doc';
    if (n.has('Workbook') || n.has('Book')) return 'xls';
    if (n.has('PowerPoint Document')) return 'ppt';
    return ['doc', 'xls', 'ppt'].includes(ext) ? ext : null;
  }
  return null;
}

const toU8 = (x) => (x instanceof Uint8Array ? x : x instanceof ArrayBuffer ? new Uint8Array(x) : ArrayBuffer.isView(x) ? new Uint8Array(x.buffer, x.byteOffset, x.byteLength) : null);

/**
 * Convert a document.
 * @param input   Uint8Array | ArrayBuffer
 * @param options { to: 'pdf'|'docx'|'xlsx'|'pptx', from?, filename?, fontProvider (for -> pdf), pdfjs (for pdf ->), maxPages?,
 *                  ocr?, onProgress? }
 * @returns       { data: Uint8Array, ext, mime, from, to, pages?, stats? }
 *
 * PDF input only: `ocr` reads scanned pages (any OCR engine; see README "Scanned PDFs"):
 *   ocr({ bytes, format: 'png', width, height, page, pages }) -> { lines: [{ words: [{ text, confidence, bbox }] }] } | null
 * and `onProgress({ stage: 'ocr', page, pages })` is called before each page is read.
 */
export async function convert(input, { to, from, filename = '', fontProvider, pdfjs, pdfOptions, maxPages, title, limits: limitOverrides, ocr, onProgress } = {}) {
  const bytes = toU8(input);
  if (!bytes || !bytes.length) throw new ConvertError('empty', 'The file is empty.');
  // `from` and `to` are caller input: only own keys of CONVERSIONS count ('constructor', '__proto__' don't)
  if (from != null && !Object.hasOwn(CONVERSIONS, from)) throw new ConvertError('unsupported', `Unknown source format "${String(from).slice(0, 20)}".`);
  const src = from || detectFormat(bytes, filename);
  if (src === 'encrypted') throw new ConvertError('encrypted', 'This file is password-protected. Remove the password and try again.');
  if (!src) throw new ConvertError('unsupported', 'This file type is not supported. Use PDF, Word, Excel or PowerPoint files.');
  const target = String(to || 'pdf').toLowerCase();
  const limits = resolveLimits(limitOverrides);
  if (!CONVERSIONS[src].includes(target)) throw new ConvertError('unsupported-target', `${LABELS[src]} files can be converted to ${CONVERSIONS[src].map((t) => LABELS[t]).join(' or ')}.`);
  if (target === 'pdf' && !fontProvider) throw new ConvertError('setup', 'convert(): a fontProvider is required to make PDFs.');
  if (src === 'pdf' && !pdfjs) throw new ConvertError('setup', 'convert(): pass the pdf.js module as { pdfjs } to read PDFs.');
  const docTitle = title ?? String(filename).replace(/\.[^.]+$/, '');
  const done = (data, ext, extra = {}) => ({ data, ext, mime: MIME[ext], from: src, to: target, ...extra });
  try {
    switch (`${src}>${target}`) {
      case 'docx>pdf': { const m = await import('./docx2pdf/index.js'); const r = await m.docxToPdf(bytes, { fontProvider, title: docTitle, limits }); return done(r.pdf, 'pdf', { pages: r.pages }); }
      case 'xlsx>pdf': { const m = await import('./xlsx2pdf/index.js'); const r = await m.xlsxToPdf(bytes, { fontProvider, title: docTitle, filename, limits }); return done(r.pdf, 'pdf', { pages: r.pages }); }
      case 'pptx>pdf': { const m = await import('./pptx2pdf/index.js'); const r = await m.pptxToPdf(bytes, { fontProvider, title: docTitle, limits }); return done(r.pdf, 'pdf', { pages: r.pages }); }
      case 'doc>pdf': { const m = await import('./doc/index.js'); const r = await m.docToPdf(bytes, { fontProvider, title: docTitle, limits }); return done(r.pdf, 'pdf', { pages: r.pages }); }
      case 'doc>docx': { const m = await import('./doc/index.js'); return done(await m.docToDocx(bytes, { limits }), 'docx'); }
      case 'xls>pdf': { const m = await import('./xls/index.js'); const r = await m.xlsToPdf(bytes, { fontProvider, title: docTitle, filename, limits }); return done(r.pdf, 'pdf', { pages: r.pages }); }
      case 'ppt>pdf': { const m = await import('./ppt/index.js'); const r = await m.pptToPdf(bytes, { fontProvider, title: docTitle, limits }); return done(r.pdf, 'pdf', { pages: r.pages }); }
      case 'pdf>docx': { const m = await import('./pdf2docx/index.js'); const r = await m.pdfToDocx(bytes, { pdfjs, pdfOptions, maxPages, limits, ocr, onProgress }); return done(r.docx, 'docx', { stats: r.stats }); }
      case 'pdf>xlsx': { const m = await import('./pdf2xlsx/index.js'); const r = await m.pdfToXlsx(bytes, { pdfjs, pdfOptions, maxPages, limits, ocr, onProgress }); return done(r.xlsx, 'xlsx', { stats: r.stats }); }
      case 'pdf>pptx': { const m = await import('./pdf2pptx/index.js'); const r = await m.pdfToPptx(bytes, { pdfjs, pdfOptions, maxPages, title: docTitle, limits, ocr, onProgress }); return done(r.pptx, 'pptx', { stats: r.stats }); }
      default: throw new ConvertError('unsupported-target', 'Unsupported conversion.');
    }
  } catch (e) {
    throw classifyError(e, src);
  }
}

/** any error from a converter -> ConvertError with a user-safe message (technical text in .detail) */
export function classifyError(e, src) {
  if (e instanceof ConvertError) return e;
  const msg = String(e?.message || e);
  const detail = msg.slice(0, 500);
  const opts = { detail, cause: e };
  if (e?.name === 'PasswordException' || /password|encrypt/i.test(msg)) return new ConvertError('encrypted', 'This file is password-protected. Remove the password and try again.', opts);
  // our own limits (LimitError: message written for users), page/cell/slide caps, and allocation failures
  if (e?.code === 'too-large') return new ConvertError('too-large', `This file is too large or complex to convert: ${msg}.`, opts);
  if (/limit is|more than \d+/i.test(msg)) return new ConvertError('too-large', `This file is too large or complex to convert: ${msg}.`, opts);
  if (e instanceof RangeError && /allocation failed|array buffer allocation|maximum (call stack|size)|set maximum size|map maximum size|invalid string length/i.test(msg)) {
    return new ConvertError('too-large', 'This file is too large or complex to convert.', opts);
  }
  if (isDamaged(e, msg)) return new ConvertError('damaged', `This ${LABELS[src] || ''} file could not be read. It may be damaged or not a valid ${LABELS[src] || 'document'} file.`.replace('  ', ' '), opts);
  return new ConvertError('failed', 'The conversion failed. Please try again or try another file.', opts);
}
