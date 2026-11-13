# doc-convert (vendored)

Pure-JavaScript converter for PDF ⇄ Word, Excel and PowerPoint, including .doc, .xls and .ppt input.
It runs in the visitor's browser as a Web Worker, so files are not uploaded.

- `lib/doc-convert/` is the library. `index.js` exports `convert()` and `detectFormat()`.
- `web/worker.js` is the worker entry point.
- `fonts/` holds the open fonts used when writing PDFs.

## How the site uses it

1. `scripts/build-doc-convert.mjs` bundles the worker into `public/doc-convert/` with esbuild. It runs on
   `postinstall`, so `npm install` and every Vercel build produce it. The folder is git-ignored.
2. `src/lib/tools/pdf/docConvert.ts` talks to the worker and to the Adobe-backed API routes.
3. `src/components/tools/OfficeConvertTool.tsx` is the shared UI of the six conversion tools. It converts in
   the browser first and falls back to the Adobe route (`src/lib/adobe.ts`) when:
   - the browser cannot convert the file,
   - scanned pages remain that the browser could not read (`stats.scannedLikely`), or
   - the visitor clicks "Try the online converter".
4. Scanned pages are read in the browser: the worker sends each one to the page (`convert({ ocr })`), where
   `src/lib/tools/pdf/ocr.ts` runs Tesseract.js from `public/tesseract/` (copied on postinstall).

Next.js never imports this folder, and ESLint ignores it. Rebuild after editing it with
`npm run build:doc-convert`.

## Limits and errors

`lib/doc-convert/common/limits.js` caps what a hostile file can make the converter allocate. Errors carry a
`code` (`encrypted`, `damaged`, `unsupported`, `too-large`, `failed`, ...) and a message written for visitors.

## Licences

Library dependencies are MIT, Apache-2.0 or BSD: pdf.js, pdfkit, fontkit, docx, fflate, xmldom, cfb and ssf.
Fonts: Carlito and Liberation (OFL-1.1), Caladea (Apache-2.0), DejaVu (Bitstream Vera licence).
