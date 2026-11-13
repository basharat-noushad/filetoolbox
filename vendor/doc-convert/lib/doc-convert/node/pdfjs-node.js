// pdf.js for Node / Vercel Functions.
// pdf.js normally spawns a worker by loading pdf.worker.mjs from disk at runtime, which bundlers and
// Vercel's file tracing can miss. Importing the worker statically and exposing it as
// globalThis.pdfjsWorker makes pdf.js run it in-thread instead - no extra file lookups, no threads.
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { promiseHooks } from 'node:v8';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

globalThis.pdfjsWorker ??= pdfjsWorker;

function pdfjsRoot() {
  const cwdRoot = path.join(process.cwd(), 'node_modules', 'pdfjs-dist');
  if (existsSync(path.join(cwdRoot, 'wasm'))) return cwdRoot;
  try {
    return path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'));
  } catch {
    return cwdRoot;
  }
}
const ROOT = pdfjsRoot();

// Pass as convert(..., { pdfOptions }). The wasm decoders read scanned pages (CCITT fax, JBIG2) and
// JPEG 2000 images; without them pdf.js drops those images. The CMaps decode text in CJK PDFs that use
// predefined encodings. next.config.mjs ships both folders with the function (outputFileTracingIncludes).
export const pdfOptions = {
  wasmUrl: path.join(ROOT, 'wasm') + path.sep,
  cMapUrl: path.join(ROOT, 'cmaps') + path.sep,
  cMapPacked: true,
};

// ---- unhandled rejections from inside pdf.js
// pdf.js runs its "worker" in this thread (see above), and some of its internal promises are never awaited:
// e.g. Catalog.getPageDict() prefetches every top-level page dictionary with xref.fetchAsync() and keeps the
// promises in a cache; when a damaged xref makes those fetches fail and loading falls back to recovery mode,
// nobody ever awaits them, and Node reports "unhandledRejection: Bad (uncompressed) XRef entry" - which
// terminates the process unless the host has a handler (repro: /tmp/bombs/report-0066.pdf after any other
// PDF). The promises are private to pdf.js, so they can't be awaited from outside. Instead, runGuarded()
// runs a conversion in an AsyncLocalStorage context and, while any guarded call is active, a V8 promise hook
// attaches a no-op rejection handler to every promise created *in that context* - pdf.js's worker-side
// work included, since it is triggered from it. That only marks those promises as handled: anyone awaiting
// them still sees the rejection, so errors still propagate to convert(). Promises created elsewhere in the
// process (other requests) are untouched, and the hook is removed when no guarded call is running.
const guardContext = new AsyncLocalStorage();
const GUARDED = Symbol('pdfjs-guarded');
const noop = () => {};
let active = 0;
let stopHook = null;
let inHook = false; // p.catch() creates a promise too; don't recurse into it
function onPromise(p) {
  if (inHook || guardContext.getStore() !== GUARDED) return;
  inHook = true;
  try { p.catch(noop); } finally { inHook = false; }
}
export async function runGuarded(fn) {
  if (active++ === 0) stopHook = promiseHooks.onInit(onPromise);
  try {
    return await guardContext.run(GUARDED, fn);
  } finally {
    if (--active === 0) { stopHook(); stopHook = null; }
  }
}

// The pdf.js module plus runGuarded, which extractPdf() uses when it is present. Pass this as { pdfjs }.
export const pdfjs = Object.freeze({ ...pdfjsLib, runGuarded });
