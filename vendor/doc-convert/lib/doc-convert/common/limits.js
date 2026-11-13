// Resource limits for hostile or damaged input.
//
// Every conversion runs with a limits object: DEFAULT_LIMITS, overridden per call by convert(x, { limits }).
// The defaults are sized for a 1 GB serverless function converting untrusted uploads; a browser (which
// converts the user's own file and usually has more memory) can raise them, e.g.
//   convert(bytes, { to: 'pdf', fontProvider, limits: { maxZipEntryBytes: 512 * 2 ** 20 } })
// Callers can also change the process-wide defaults by assigning to DEFAULT_LIMITS.
//
// A limit that is exceeded throws a LimitError, which convert() reports as ConvertError code 'too-large'.

const MB = 1024 * 1024;

export const DEFAULT_LIMITS = {
  // ---- zip packages (.docx/.xlsx/.pptx). Enforced on the bytes actually inflated, never on the sizes the
  // zip declares (those are attacker-controlled). Parts are inflated lazily, so unreferenced parts cost nothing.
  maxZipEntries: 20000, // central-directory / local-header entries
  maxZipEntryBytes: 160 * MB, // one inflated part
  maxZipTotalBytes: 400 * MB, // all parts inflated during one conversion
  // ---- OLE2 (.doc/.xls/.ppt): cfb copies streams out of the container; this bounds what we decode from them
  maxOleStreamBytes: 200 * MB,
  // ---- images
  maxImagePixels: 100e6, // any image we decode or allocate pixels for ourselves (PDF images, DIBs)
  // PNGs that pdfkit has to decode itself (alpha channel, tRNS, interlaced) cost ~10 bytes per pixel there,
  // so they get a lower cap. Opaque, non-interlaced PNGs are embedded without decoding and are not affected.
  maxDecodedPngPixels: 25e6,
  // pdf.js: images above this many pixels are not decoded (pdf.js's own maxImageSize option); they are skipped
  maxPdfImagePixels: 40e6,
  // ---- OCR of scanned PDF pages (convert({ ocr })): pages read per conversion (later scanned pages stay
  // pictures), and the pixels of one image handed to the OCR function (larger scans are downscaled to fit)
  maxOcrPages: 60,
  maxOcrImagePixels: 16e6,
  // ---- document structure
  maxCells: 2_000_000, // spreadsheet cells per workbook
  maxMerges: 100_000, // merged ranges per sheet
  maxChartPoints: 32_000, // points per chart series (c:ptCount is file-supplied)
  maxSlides: 1000,
  maxTableColumns: 1000, // Word/PowerPoint table grid columns (gridSpan is file-supplied)
};

export class LimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LimitError';
    this.code = 'too-large';
  }
}

/** the input is not a readable file of its type (missing/garbled structure); convert() -> code 'damaged' */
export class DamagedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DamagedError';
    this.code = 'damaged';
  }
}

/** DEFAULT_LIMITS with the caller's overrides; unknown keys and non-numbers are ignored */
export function resolveLimits(over) {
  const out = { ...DEFAULT_LIMITS };
  if (over && typeof over === 'object') {
    for (const k of Object.keys(DEFAULT_LIMITS)) {
      const v = over[k];
      if (typeof v === 'number' && v > 0) out[k] = v;
    }
  }
  return out;
}

/** clamp a file-supplied count/index to an integer in [lo, hi]; NaN -> lo */
export function clampInt(v, lo, hi) {
  const n = Number(v);
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.trunc(n))); // +-Infinity clamps to hi/lo
}
