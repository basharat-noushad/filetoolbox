import { build } from 'esbuild'

// Serve executable browser workers and share the same self-hosted ONNX runtime across both AI tools.
await build({
  entryPoints: ['ortWorker', 'upscaleWorker', 'vectorizeWorker'].map(name => `src/lib/tools/image/${name}.ts`),
  outdir: 'public/image-workers',
  chunkNames: 'chunks/[name]-[hash]',
  conditions: ['onnxruntime-web-use-extern-wasm'],
  platform: 'browser',
  format: 'esm',
  splitting: true,
  bundle: true,
  minify: true,
  target: 'es2020',
})
