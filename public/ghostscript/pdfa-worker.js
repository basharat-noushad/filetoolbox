// PDF -> PDF/A conversion worker. Runs Ghostscript (AGPL-3.0, see LICENSE.txt in this folder)
// compiled to WebAssembly. gs.js / gs.wasm are copied here from @okathira/ghostpdl-wasm by postinstall.
// Plain JS served from /public so no bundler touches it; real URL, so relative imports work.

const PDFA_DEF = `%!
[/_objdef {icc_PDFA} /type /stream /OBJ pdfmark
[{icc_PDFA} <</N 3>> /PUT pdfmark
[{icc_PDFA} (%rom%iccprofiles/srgb.icc) (r) file /PUT pdfmark
[/_objdef {OutputIntent_PDFA} /type /dict /OBJ pdfmark
[{OutputIntent_PDFA} <<
  /Type /OutputIntent /S /GTS_PDFA1
  /DestOutputProfile {icc_PDFA}
  /OutputConditionIdentifier (sRGB IEC61966-2.1)
  /Info (sRGB IEC61966-2.1)
>> /PUT pdfmark
[{Catalog} <</OutputIntents [{OutputIntent_PDFA}]>> /PUT pdfmark
`

let engine // Promise<{ load, wasmModule }>, compiled once, fresh instance per run

function getEngine() {
  engine ??= (async () => {
    const base = new URL('./', self.location.href)
    const [{ default: load }, wasmModule] = await Promise.all([
      import(new URL('gs.js', base).href),
      WebAssembly.compileStreaming(fetch(new URL('gs.wasm', base))),
    ])
    return { load, wasmModule }
  })()
  engine.catch(() => { engine = undefined }) // allow retry after a failed download
  return engine
}

self.onmessage = async ({ data: { bytes, level } }) => {
  let gs
  const log = []
  try {
    const { load, wasmModule } = await getEngine()
    self.postMessage({ type: 'loaded' })
    let instFailed
    const instError = new Promise((_, reject) => { instFailed = reject })
    gs = await Promise.race([instError, load({
      print: (s) => log.push(s),
      printErr: (s) => log.push(s),
      instantiateWasm: (imports, done) => {
        WebAssembly.instantiate(wasmModule, imports).then((inst) => done(inst, wasmModule), instFailed)
        return {}
      },
    })])
    gs.FS.writeFile('/in.pdf', new Uint8Array(bytes))
    gs.FS.writeFile('/PDFA_def.ps', PDFA_DEF)
    const rc = gs.callMain([
      `-dPDFA=${level}`, '-dPDFACompatibilityPolicy=1', '-sColorConversionStrategy=RGB',
      // PDF/A-1 needs PDF 1.4; without it gs 10.06 wasm crashes on transparent pages.
      ...(level === 1 ? ['-dCompatibilityLevel=1.4'] : []),
      '-sDEVICE=pdfwrite', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dQUIET',
      '-sOutputFile=/out.pdf', '/PDFA_def.ps', '/in.pdf',
    ])
    const text = log.join('\n')
    // gs exits 0 on a locked/unreadable file but writes an empty document, so check its messages.
    if (/requires a password/i.test(text)) throw Object.assign(new Error(text), { code: 'password' })
    if (rc !== 0 || /Couldn't initialise file|No pages will be processed/i.test(text)) {
      throw Object.assign(new Error(text), { code: 'unreadable' })
    }
    const out = gs.FS.readFile('/out.pdf')
    self.postMessage({ type: 'done', bytes: out.buffer }, [out.buffer])
  } catch (err) {
    self.postMessage({ type: 'error', code: err?.code || 'engine', detail: String(err?.message || err).slice(0, 2000) })
  } finally {
    for (const f of ['/in.pdf', '/out.pdf', '/PDFA_def.ps']) {
      try { gs?.FS.unlink(f) } catch { /* not created */ }
    }
  }
}
