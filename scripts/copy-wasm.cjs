// Copies browser-side engines from node_modules into public/ so they're served same-origin
// and always match the installed package versions. Runs on postinstall.
const fs = require('fs')
const copies = [
  ['@ffmpeg/core/dist/umd/ffmpeg-core.js', 'ffmpeg/ffmpeg-core.js'],
  ['@ffmpeg/core/dist/umd/ffmpeg-core.wasm', 'ffmpeg/ffmpeg-core.wasm'],
  ['pdfjs-dist/build/pdf.worker.min.mjs', 'pdf.worker.min.js'],
  ['@neslinesli93/qpdf-wasm/dist/qpdf.js', 'qpdf/qpdf.js'],
  ['@neslinesli93/qpdf-wasm/dist/qpdf.wasm', 'qpdf/qpdf.wasm'],
  ['@okathira/ghostpdl-wasm/dist/gs.js', 'ghostscript/gs.js'],
  ['@okathira/ghostpdl-wasm/dist/gs.wasm', 'ghostscript/gs.wasm'],
  ['@okathira/ghostpdl-wasm/LICENSE', 'ghostscript/LICENSE.txt'],
  // Tesseract for scanned pages in the PDF -> Office tools (src/lib/tools/pdf/ocr.ts): its worker, the
  // LSTM-only cores (relaxed SIMD, SIMD, plain; it picks one per browser) and English data (best_int)
  ['tesseract.js/dist/worker.min.js', 'tesseract/worker.min.js'],
  ['tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract/core/tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract/core/tesseract-core-simd-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract/core/tesseract-core-lstm.wasm.js'],
  ['@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'tesseract/lang/eng.traineddata.gz'],
]
for (const [from, to] of copies) {
  fs.mkdirSync(require('path').dirname('public/' + to), { recursive: true })
  fs.copyFileSync('node_modules/' + from, 'public/' + to)
}
// MediaPipe wasm runtime for background blur (src/lib/tools/image/backgroundBlur.ts); the .tflite model is committed
const wasmSrc = 'node_modules/@mediapipe/tasks-vision/wasm'
fs.mkdirSync('public/mediapipe/wasm', { recursive: true })
// forVisionTasks(path) without useModule only loads vision_wasm_internal.*; the *_module_* build is unused (15 MB).
for (const f of fs.readdirSync(wasmSrc)) if (!f.includes('_module_')) fs.copyFileSync(wasmSrc + '/' + f, 'public/mediapipe/wasm/' + f)
// onnxruntime-web runtime (wasm + its .mjs loaders) for in-browser AI models (background blur, upscale);
// self-hosted so the CSP stays 'self' and nothing loads from a CDN. Set ort.env.wasm.wasmPaths = '/ort/'.
const ortSrc = 'node_modules/onnxruntime-web/dist'
fs.mkdirSync('public/ort', { recursive: true })
// The default 'onnxruntime-web' import (ort.bundle.min.mjs) only loads the jsep build (WebGPU + wasm).
// asyncify/jspi/plain builds are never requested; copying them added ~61 MB to every deployment.
for (const f of fs.readdirSync(ortSrc)) if (/^ort-wasm-simd-threaded\.jsep\.(wasm|mjs)$/.test(f)) fs.copyFileSync(ortSrc + '/' + f, 'public/ort/' + f)
