// Builds the in-browser document converter (vendor/doc-convert) into public/doc-convert/:
//   worker.js + chunks/   the converter as a module Web Worker, split so each conversion loads only its code
//   fonts/                open fonts used when writing PDFs (Carlito, Caladea, Liberation, DejaVu)
//   pdfjs/                pdf.js image decoders (wasm) and CMaps, for scanned and CJK PDFs
// Runs on postinstall (after copy-wasm.cjs), so `npm install` and every Vercel build produce it.
import { build } from 'esbuild'
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const src = path.join(root, 'vendor', 'doc-convert')
const out = path.join(root, 'public', 'doc-convert')
const pdfjs = path.join(root, 'node_modules', 'pdfjs-dist')

rmSync(out, { recursive: true, force: true })
await build({
  entryPoints: [path.join(src, 'web', 'worker.js')],
  outdir: out,
  bundle: true,
  format: 'esm',
  splitting: true,
  platform: 'browser',
  target: 'es2020',
  minify: true,
  legalComments: 'none',
  entryNames: '[name]',
  chunkNames: 'chunks/[name]-[hash]',
  logLevel: 'warning',
})

mkdirSync(path.join(out, 'fonts'), { recursive: true })
for (const f of readdirSync(path.join(src, 'fonts'))) {
  if (f.endsWith('.ttf')) cpSync(path.join(src, 'fonts', f), path.join(out, 'fonts', f))
}
mkdirSync(path.join(out, 'pdfjs', 'wasm'), { recursive: true })
for (const f of readdirSync(path.join(pdfjs, 'wasm'))) {
  if (/^(jbig2|openjpeg|qcms)/.test(f)) cpSync(path.join(pdfjs, 'wasm', f), path.join(out, 'pdfjs', 'wasm', f))
}
cpSync(path.join(pdfjs, 'cmaps'), path.join(out, 'pdfjs', 'cmaps'), { recursive: true })
console.log('doc-convert: built public/doc-convert')
