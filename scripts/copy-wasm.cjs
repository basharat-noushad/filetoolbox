// Copies browser-side engines from node_modules into public/ so they're served same-origin
// and always match the installed package versions. Runs on postinstall.
const fs = require('fs')
const copies = [
  ['pdfjs-dist/build/pdf.worker.min.mjs', 'pdf.worker.min.js'],
  ['@neslinesli93/qpdf-wasm/dist/qpdf.js', 'qpdf/qpdf.js'],
  ['@neslinesli93/qpdf-wasm/dist/qpdf.wasm', 'qpdf/qpdf.wasm'],
  ['@okathira/ghostpdl-wasm/dist/gs.js', 'ghostscript/gs.js'],
  ['@okathira/ghostpdl-wasm/dist/gs.wasm', 'ghostscript/gs.wasm'],
  ['@okathira/ghostpdl-wasm/LICENSE', 'ghostscript/LICENSE.txt'],
]
for (const [from, to] of copies) {
  fs.mkdirSync(require('path').dirname('public/' + to), { recursive: true })
  fs.copyFileSync('node_modules/' + from, 'public/' + to)
}
