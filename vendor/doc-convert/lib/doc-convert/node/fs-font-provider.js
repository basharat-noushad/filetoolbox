// Font provider for Node / Vercel Functions: reads the bundled open fonts from a fonts/ directory.
// next.config.mjs adds ./fonts to the function's traced files (outputFileTracingIncludes),
// otherwise Vercel would not ship them because they are read with a dynamic path.
//
// Where the fonts are looked for, first match wins (decided on first use, not at import time):
//   1. $DOC_CONVERT_FONT_DIR
//   2. <process.cwd()>/fonts            (Vercel functions, `next start`, the CLI run from the project root)
//   3. <this module>/../../../fonts     (the project's fonts/ when the library is used from another cwd)
// Font bytes are cached in memory, so a warm function reads each face from disk once.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILES = {
  Carlito: ['Carlito-Regular', 'Carlito-Bold', 'Carlito-Italic', 'Carlito-BoldItalic'],
  Caladea: ['Caladea-Regular', 'Caladea-Bold', 'Caladea-Italic', 'Caladea-BoldItalic'],
  'Liberation Sans': ['LiberationSans-Regular', 'LiberationSans-Bold', 'LiberationSans-Italic', 'LiberationSans-BoldItalic'],
  'Liberation Serif': ['LiberationSerif-Regular', 'LiberationSerif-Bold', 'LiberationSerif-Italic', 'LiberationSerif-BoldItalic'],
  'Liberation Mono': ['LiberationMono-Regular', 'LiberationMono-Bold', 'LiberationMono-Italic', 'LiberationMono-BoldItalic'],
  'DejaVu Sans': ['DejaVuSans', 'DejaVuSans-Bold', 'DejaVuSans-Oblique', 'DejaVuSans-BoldOblique'],
};
const PROBE = 'LiberationSans-Regular.ttf';

function candidates() {
  const out = [];
  if (process.env.DOC_CONVERT_FONT_DIR) out.push(path.resolve(process.env.DOC_CONVERT_FONT_DIR));
  out.push(path.join(process.cwd(), 'fonts'));
  try {
    out.push(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../fonts'));
  } catch { /* bundled without a file: URL */ }
  return out;
}

let fontDir = null;
/** the first candidate directory that holds the fonts (re-checked until one is found) */
export function resolveFontDir() {
  if (fontDir) return fontDir;
  const list = candidates();
  fontDir = list.find((d) => existsSync(path.join(d, PROBE))) || null;
  return fontDir ?? list[0];
}

const cache = new Map(); // file name -> Promise<Uint8Array | null>

export async function fsFontProvider(family, bold, italic) {
  const file = FILES[family]?.[(bold ? 1 : 0) + (italic ? 2 : 0)];
  if (!file) return null;
  if (!cache.has(file)) {
    const p = readFile(path.join(resolveFontDir(), `${file}.ttf`)).then((b) => new Uint8Array(b), () => null);
    cache.set(file, p);
    p.then((v) => { if (!v) cache.delete(file); }); // not found: look again next time (e.g. after fontDir is fixed)
  }
  return cache.get(file);
}
