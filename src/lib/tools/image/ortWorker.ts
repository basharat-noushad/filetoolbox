import * as ort from 'onnxruntime-web'

// Generic ONNX runner used by Blur Image (MODNet / U2-Net-p / Depth Anything). The main thread downloads the
// model bytes (so it can show progress) and hands them over; inference stays off the UI thread.
// WebGPU first where the model is float, wasm fallback (also used if a WebGPU run fails).
export type OrtRequest =
  | { type: 'init'; id: number; key: string; buffer: ArrayBuffer; gpu: boolean; origin: string }
  | { type: 'run'; id: number; key: string; data: Float32Array; dims: number[] }
export type OrtReply =
  | { id: number; ok: true; out?: Float32Array; dims?: number[]; backend: string }
  | { id: number; ok: false; message: string }

// the worker's base URL can be blob:, so wasm paths must be absolute (origin comes from the main thread)

type Entry = { session: ort.InferenceSession; bytes: Uint8Array; backend: string }
const models = new Map<string, Entry>()

async function create(bytes: Uint8Array, gpu: boolean) {
  if (gpu) {
    try { return { session: await ort.InferenceSession.create(bytes, { executionProviders: ['webgpu'] }), backend: 'webgpu' } } catch { /* fall through */ }
  }
  return { session: await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }), backend: 'wasm' }
}

async function exec(e: Entry, data: Float32Array, dims: number[]) {
  const feeds = { [e.session.inputNames[0]]: new ort.Tensor('float32', data, dims) }
  const res = await e.session.run(feeds)
  const t = res[e.session.outputNames[0]]
  return { out: new Float32Array(t.data as Float32Array), dims: [...t.dims] }
}

self.onmessage = async (ev: MessageEvent<OrtRequest>) => {
  const m = ev.data
  try {
    if (m.type === 'init') {
      ort.env.wasm.wasmPaths = m.origin + '/ort/'
      const bytes = new Uint8Array(m.buffer)
      const { session, backend } = await create(bytes, m.gpu)
      models.set(m.key, { session, bytes, backend })
      self.postMessage({ id: m.id, ok: true, backend } satisfies OrtReply)
    } else {
      const e = models.get(m.key)
      if (!e) throw new Error('Model not loaded')
      let r
      try { r = await exec(e, m.data.slice(), m.dims) } catch (err) {
        if (e.backend === 'wasm') throw err
        const c = await create(e.bytes, false) // WebGPU built fine but failed at run time (driver/memory)
        e.session = c.session; e.backend = c.backend
        r = await exec(e, m.data, m.dims)
      }
      self.postMessage({ id: m.id, ok: true, ...r, backend: e.backend } satisfies OrtReply, { transfer: [r.out.buffer] })
    }
  } catch (err) {
    self.postMessage({ id: m.id, ok: false, message: err instanceof Error ? err.message : String(err) } satisfies OrtReply)
  }
}
