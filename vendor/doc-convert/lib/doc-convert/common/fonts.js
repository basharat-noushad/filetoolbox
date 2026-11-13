// Font resolution, metrics and measurement. Fonts are injected through a provider so the
// same core runs in Node/Vercel (read from disk) and in the browser (fetch from /fonts).
//
// Serverless notes:
//  - parsed fonts are cached per provider for the life of the process, so warm invocations
//    don't re-read or re-parse font files;
//  - the fallback font is only loaded when the document contains characters the primary
//    fonts can't render.
import * as fontkit from 'fontkit';

// Word font -> open, redistributable font (metric-compatible where one exists).
const FAMILY_MAP = {
  calibri: 'Carlito', 'calibri light': 'Carlito', aptos: 'Carlito', 'aptos display': 'Carlito', 'aptos narrow': 'Carlito',
  cambria: 'Caladea', 'cambria math': 'Caladea',
  arial: 'Liberation Sans', helvetica: 'Liberation Sans', 'segoe ui': 'Liberation Sans',
  'trebuchet ms': 'Liberation Sans', 'century gothic': 'Liberation Sans', 'liberation sans': 'Liberation Sans',
  'times new roman': 'Liberation Serif', times: 'Liberation Serif', georgia: 'Liberation Serif',
  garamond: 'Liberation Serif', 'book antiqua': 'Liberation Serif', 'liberation serif': 'Liberation Serif',
  'courier new': 'Liberation Mono', courier: 'Liberation Mono', consolas: 'Liberation Mono', 'liberation mono': 'Liberation Mono',
  verdana: 'DejaVu Sans', tahoma: 'DejaVu Sans', 'dejavu sans': 'DejaVu Sans',
  'lucida sans unicode': 'DejaVu Sans', 'lucida sans': 'DejaVu Sans', 'lucida grande': 'DejaVu Sans',
  'franklin gothic book': 'Liberation Sans', 'franklin gothic medium': 'Liberation Sans',
  carlito: 'Carlito', caladea: 'Caladea',
};
export const FALLBACK = 'DejaVu Sans';
// Office fonts that ship only a regular face: Windows/Office synthesize bold and italic from it (keeping the
// regular advance widths), so a real bold substitute would be far too wide
const REGULAR_ONLY = new Set(['lucida sans unicode', 'lucida console', 'ms sans serif', 'calibri light', 'segoe ui light', 'segoe ui semilight']);

export function mapFamily(name) {
  const k = String(name || '').trim().toLowerCase();
  if (FAMILY_MAP[k]) return FAMILY_MAP[k];
  // word boundaries matter: "Lucida Sans Unicode" is not a code font, "Microsoft Sans Serif" is not a serif
  if (/\bmono\b|\bcode\b|courier|consol|typewriter/.test(k)) return 'Liberation Mono';
  if (/\bsans\b|gothic|grotesk/.test(k)) return 'Liberation Sans';
  if (/serif|roman|times|minion|palatino|baskerville|bodoni|didot|garamond|georgia|century|bookman|goudy|constantia|rockwell|perpetua|cambria/.test(k)) return 'Liberation Serif';
  return 'Liberation Sans';
}

const CACHES = new WeakMap(); // provider -> Map("family|b|i" -> Promise<rec|null>)
let nextId = 0;

function loadFile(provider, family, bold, italic) {
  if (!CACHES.has(provider)) CACHES.set(provider, new Map());
  const cache = CACHES.get(provider);
  const key = `${family}|${bold ? 1 : 0}|${italic ? 1 : 0}`;
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      const bytes = await provider(family, bold, italic);
      if (!bytes) return null;
      const font = fontkit.create(bytes);
      const upm = font.unitsPerEm;
      return {
        id: `F${++nextId}`, family, bold, italic, font, upm, bytes,
        asc: font.hhea.ascent / upm,
        desc: (-font.hhea.descent + Math.max(0, font.hhea.lineGap)) / upm,
        ulPos: -(font.post?.underlinePosition ?? -100) / upm,
        ulThick: (font.post?.underlineThickness || 50) / upm,
        widths: new Map(), // text -> advance in font units (shared across requests)
        fakeBold: false, fakeItalic: false,
      };
    })());
  }
  return cache.get(key);
}

export class FontBook {
  constructor(provider) {
    this.provider = provider; // async (family, bold, italic) => Uint8Array | null
    this.recs = new Map(); // "Word font|b|i" -> rec
    this.fallbacks = new Map(); // "b|i" -> rec
  }

  /** keys: Set of "Word font|b|i"; chars: Map(key -> Set of characters) */
  async prepare(keys, chars = new Map()) {
    for (const k of keys) await this._ensure(k);
    const need = new Set();
    for (const [k, set] of chars) {
      const rec = this.recs.get(k);
      if (!rec) continue;
      for (const ch of set) {
        const cp = ch.codePointAt(0);
        if (cp > 32 && !rec.font.hasGlyphForCodePoint(cp)) { need.add(k.split('|').slice(1).join('|')); break; }
      }
    }
    for (const style of need) {
      const [b, i] = style.split('|');
      const rec = await loadFile(this.provider, FALLBACK, b === '1', i === '1');
      if (rec) this.fallbacks.set(style, rec);
    }
  }

  async _ensure(key) {
    if (this.recs.has(key)) return this.recs.get(key);
    const [name, b, i] = key.split('|');
    const bold = b === '1';
    const italic = i === '1';
    const family = mapFamily(name);
    const regularOnly = REGULAR_ONLY.has(String(name).trim().toLowerCase());
    let rec = regularOnly && (bold || italic) ? null : await loadFile(this.provider, family, bold, italic);
    if (!rec) {
      const base = await loadFile(this.provider, family, false, false);
      if (base) rec = { ...base, fakeBold: bold, fakeItalic: italic };
    }
    if (!rec) rec = await loadFile(this.provider, FALLBACK, bold, italic);
    if (!rec) rec = await loadFile(this.provider, FALLBACK, false, false);
    if (!rec) throw new Error(`No font available for "${name}" (provider returned nothing)`);
    this.recs.set(key, rec);
    return rec;
  }

  get(rp) {
    return this.recs.get(`${rp.font}|${rp.bold ? 1 : 0}|${rp.italic ? 1 : 0}`) || this.recs.values().next().value;
  }

  fallback(rp) {
    return this.fallbacks.get(`${rp.bold ? 1 : 0}|${rp.italic ? 1 : 0}`) || this.fallbacks.get('0|0') || null;
  }

  covers(rec, text) {
    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (cp > 32 && !rec.font.hasGlyphForCodePoint(cp)) return false;
    }
    return true;
  }

  width(rec, size, text, charSpacing = 0) {
    let units = rec.widths.get(text);
    if (units === undefined) {
      units = rec.font.layout(text).advanceWidth;
      if (rec.widths.size < 50000) rec.widths.set(text, units);
    }
    return (units / rec.upm) * size + charSpacing * [...text].length;
  }

  /**
   * Register only this document's fonts. Each PDF gets its own fontkit instance (parsing is lazy and cheap):
   * fontkit caches glyph objects with the characters they were first created for, and pdfkit's subsetter
   * creates component glyphs (the "e" inside "é") with none, so a shared instance would leave later documents
   * without a ToUnicode entry for those letters - they would draw but not copy, search or extract.
   */
  register(doc) {
    const done = new Set();
    for (const rec of [...this.recs.values(), ...this.fallbacks.values()]) {
      if (done.has(rec.id)) continue;
      done.add(rec.id);
      doc.registerFont(rec.id, rec.bytes ? fontkit.create(rec.bytes) : rec.font);
    }
  }
}
