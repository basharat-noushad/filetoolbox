import { traceImageData, type TraceRequest } from './vectorizeCore'

self.onmessage = (e: MessageEvent<TraceRequest>) => {
  try {
    self.postMessage({ svg: traceImageData(e.data) })
  } catch (err) {
    self.postMessage({ error: String(err) })
  }
}
