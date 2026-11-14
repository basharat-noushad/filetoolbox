'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { Check, Copy, Download, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolResult } from '@/components/tools/ToolResult'
import {
  FORMS, KIND_GROUPS, buildPayload, contrastRatio, defaultFields,
  type FieldDef, type QrEcc, type QrFields, type QrKind,
} from '@/lib/tools/image/qr'
import {
  MAX_BULK, MAX_PX, defaultDesign, parseBulk, renderBulkZip, renderJpg, renderPdf, renderPng, renderSvg, verifyScan,
  type PrintUnit, type QrDesign,
} from '@/lib/tools/image/qrRender'

const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500'
const label = 'block text-sm font-medium text-gray-700 mb-1'
const pill = (on: boolean) => `px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`

const DOTS = ['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'] as const
const CORNER_SQ = ['square', 'dot', 'extra-rounded', 'rounded', 'classy'] as const
const CORNER_DOT = ['square', 'dot', 'rounded', 'extra-rounded'] as const

function Section({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border border-gray-200 rounded-lg">
      <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-semibold text-gray-800 flex items-center justify-between">
        {title}<span aria-hidden className="text-gray-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="px-4 pb-4 pt-1 grid sm:grid-cols-2 gap-4">{children}</div>
    </details>
  )
}

function Field({ id, title, children, full }: { id: string; title: string; children: React.ReactNode; full?: boolean }) {
  return <div className={full ? 'sm:col-span-2' : ''}><label htmlFor={id} className={label}>{title}</label>{children}</div>
}

function Select<T extends string>({ id, value, onChange, options }: { id: string; value: T; onChange: (v: T) => void; options: readonly T[] }) {
  return (
    <select id={id} className={input} value={value} onChange={e => onChange(e.target.value as T)}>
      {options.map(o => <option key={o} value={o}>{o.replace(/-/g, ' ')}</option>)}
    </select>
  )
}

function ColorInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return <input id={id} type="color" value={value} onChange={e => onChange(e.target.value)} className="h-9 w-full rounded border border-gray-300 cursor-pointer" />
}

function KindForm({ kind, f, set }: { kind: QrKind; f: QrFields; set: (k: string, v: string) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {FORMS[kind].filter((d: FieldDef) => !d.show || d.show(f)).map(d => {
        const id = `qr-${d.key}`
        const full = !d.half
        const v = f[d.key] ?? ''
        let control: React.ReactNode
        if (d.type === 'checkbox') {
          return <label key={d.key} className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={!!v} onChange={e => set(d.key, e.target.checked ? '1' : '')} /> {d.label}</label>
        }
        if (d.type === 'select') control = <select id={id} className={input} value={v} onChange={e => set(d.key, e.target.value)}>{d.options!.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</select>
        else if (d.type === 'textarea') control = <textarea id={id} className={input} rows={3} value={v} onChange={e => set(d.key, e.target.value)} />
        else control = <input id={id} className={input} type={d.type ?? 'text'} step={d.type === 'number' ? 'any' : undefined} min={d.type === 'number' ? 0 : undefined} placeholder={d.placeholder} value={v} onChange={e => set(d.key, e.target.value)} />
        return <Field key={d.key} id={id} title={d.label} full={full}>{control}{d.hint && <p className="mt-1 text-xs text-gray-500">{d.hint}</p>}</Field>
      })}
    </div>
  )
}

const note = (cls: string) => `text-sm rounded-lg px-3 py-2 border ${cls}`

export function QrCodeGeneratorClient() {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [kind, setKind] = useState<QrKind>('url')
  const [f, setF] = useState<QrFields>(defaultFields)
  const [d, setD] = useState<QrDesign>(defaultDesign)
  const [size, setSize] = useState(1024)
  const [printW, setPrintW] = useState(5)
  const [unit, setUnit] = useState<PrintUnit>('cm')
  const [bulkText, setBulkText] = useState('')
  const [bulkProgress, setBulkProgress] = useState<number | null>(null)
  const [bulkResult, setBulkResult] = useState<{ blob: Blob; note: string } | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [scan, setScan] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const prevUrl = useRef<string | null>(null)

  const setD2 = <K extends keyof QrDesign>(k: K, v: QrDesign[K]) => setD(p => ({ ...p, [k]: v }))
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))
  const bulk = useMemo(() => parseBulk(bulkText), [bulkText])
  const single = useMemo(() => buildPayload(kind, f), [kind, f])
  const data = mode === 'bulk' ? bulk.rows[0]?.value ?? '' : single.data
  const msg = mode === 'bulk' ? null : single.error ?? null
  const dKey = JSON.stringify(d)

  // reset stale bulk result whenever its inputs change
  useEffect(() => { setBulkResult(null) }, [bulkText, dKey, size])

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      if (!data) { setPreview(null); setScan('idle'); setError(null); return }
      try {
        const blob = await renderPng(data, d, Math.min(size, 480))
        const ok = await verifyScan(blob, data)
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
        prevUrl.current = url
        setPreview(url); setScan(ok ? 'ok' : 'fail'); setError(null)
      } catch {
        if (!cancelled) { setPreview(null); setScan('idle'); setError('That content is too long to fit in a QR code. Shorten it or lower the error correction.') }
      }
    }, 200)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dKey, Math.min(size, 480)])

  useEffect(() => () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current) }, [])

  const onLogo = (file: File | undefined) => {
    if (!file) { setD2('logo', null); return }
    const reader = new FileReader()
    reader.onload = () => setD2('logo', String(reader.result))
    reader.onerror = () => setError('Could not read that logo image.')
    reader.readAsDataURL(file)
  }

  const warnings = useMemo(() => {
    const w: string[] = []
    const bg = d.bgTransparent ? '#ffffff' : d.bg
    const cs = [d.dotColor, ...(d.gradient ? [d.gradColor2] : [])]
    if (cs.some(c => contrastRatio(c, bg) < 3)) w.push(`Low contrast between the code and the background (${Math.min(...cs.map(c => contrastRatio(c, bg))).toFixed(1)}:1). Aim for at least 3:1, ideally a dark code on a light background.`)
    else if (contrastRatio(d.dotColor, '#ffffff') < contrastRatio(bg, '#ffffff')) w.push('Light code on a dark background (inverted). Many scanner apps cannot read inverted codes.')
    if (d.bgTransparent) w.push('Transparent background: the code will only scan when placed on a light surface.')
    if (d.logo && d.logoSize > 0.3) w.push('The logo covers a large part of the code. Reduce its size if scanning is unreliable.')
    return w
  }, [d])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null)
    try { await fn() } catch { setError('Could not create the file. Please try different content, size or settings.') } finally { setBusy(false) }
  }
  const px = Math.min(MAX_PX, Math.max(128, size))
  const download = (type: 'png' | 'jpg' | 'svg' | 'pdf') => run(async () => {
    const blob = type === 'png' ? await renderPng(data, d, px)
      : type === 'jpg' ? await renderJpg(data, d, px)
        : type === 'svg' ? await renderSvg(data, d, px)
          : await renderPdf(data, d, printW, unit)
    saveAs(blob, `qr-code.${type}`)
  })
  const copy = () => run(async () => {
    const item = new ClipboardItem({ 'image/png': renderPng(data, d, Math.min(px, 1024)) })
    await navigator.clipboard.write([item])
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  })
  const makeBulk = () => run(async () => {
    setBulkProgress(0)
    try {
      const { blob, failed } = await renderBulkZip(bulk.rows, d, Math.min(px, 1000), setBulkProgress)
      setBulkResult({ blob, note: failed ? `${bulk.rows.length - failed} codes made, ${failed} skipped (too long to encode).` : `${bulk.rows.length} QR codes ready.` })
    } finally { setBulkProgress(null) }
  })
  const onCsv = async (file: File | undefined) => { if (file) setBulkText(await file.text()) }

  const hasData = !!data
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div role="group" aria-label="Mode" className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-50">
          {(['single', 'bulk'] as const).map(m => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-sm font-medium cursor-pointer ${mode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}>
              {m === 'single' ? 'Single code' : `Bulk (up to ${MAX_BULK})`}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">Static codes: they never expire, nothing is tracked, no account needed.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4 min-w-0">
          {mode === 'single' ? (<>
            <div role="tablist" aria-label="Content type" className="space-y-2">
              {KIND_GROUPS.map(g => (
                <div key={g.label} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 w-24 shrink-0">{g.label}</span>
                  {g.kinds.map(k => <button key={k.id} role="tab" aria-selected={kind === k.id} onClick={() => setKind(k.id)} className={pill(kind === k.id)}>{k.label}</button>)}
                </div>
              ))}
            </div>
            <KindForm kind={kind} f={f} set={set} />
            {msg && <p role="alert" className={note('text-red-700 bg-red-50 border-red-200')}>{msg}</p>}
          </>) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="qr-bulk" className={label}>Values, one per line</label>
                <textarea id="qr-bulk" className={`${input} font-mono`} rows={8} value={bulkText} onChange={e => setBulkText(e.target.value)}
                  placeholder={'https://example.com/product-1\nhttps://example.com/product-2\n\nor CSV with a header: name,url'} />
                <p className="mt-1 text-xs text-gray-500">Each line is encoded exactly as written. With a CSV header (<code>url</code>, <code>text</code> or <code>value</code>, plus optional <code>name</code>) the name becomes the file name; otherwise files are numbered 001, 002...</p>
              </div>
              <div>
                <label htmlFor="qr-csv" className={label}>Or upload a CSV / text file</label>
                <input id="qr-csv" type="file" accept=".csv,.txt,text/csv,text/plain" onChange={e => onCsv(e.target.files?.[0])} className="text-sm w-full min-w-0" />
              </div>
              <p className="text-sm text-gray-700" aria-live="polite">{bulk.rows.length ? `${bulk.rows.length} code${bulk.rows.length > 1 ? 's' : ''} found.` : 'No values yet.'}{bulk.truncated && ` Only the first ${MAX_BULK} are used.`} The current design and frame are applied to every code.</p>
              <Button onClick={makeBulk} disabled={!bulk.rows.length || busy} className="cursor-pointer">
                {bulkProgress !== null ? `Generating ${bulkProgress} / ${bulk.rows.length}…` : `Generate ${bulk.rows.length || ''} codes as ZIP`}
              </Button>
              {bulkResult && <ToolResult blob={bulkResult.blob} filename="qr-codes.zip" label={bulkResult.note} />}
            </div>
          )}

          <div className="space-y-2">
            <Section title="Colours and dot style" open>
              <Field id="qr-dots" title="Dot style"><Select id="qr-dots" value={d.dotStyle} onChange={v => setD2('dotStyle', v)} options={DOTS} /></Field>
              <Field id="qr-fg" title={d.gradient ? 'Gradient start' : 'Dot colour'}><ColorInput id="qr-fg" value={d.dotColor} onChange={v => setD2('dotColor', v)} /></Field>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={d.gradient} onChange={e => setD2('gradient', e.target.checked)} /> Use a gradient</label>
              {d.gradient && (<>
                <Field id="qr-gt" title="Gradient type"><Select id="qr-gt" value={d.gradType} onChange={v => setD2('gradType', v)} options={['linear', 'radial']} /></Field>
                <Field id="qr-g2" title="Gradient end"><ColorInput id="qr-g2" value={d.gradColor2} onChange={v => setD2('gradColor2', v)} /></Field>
                {d.gradType === 'linear' && <Field id="qr-ga" title={`Angle: ${d.gradAngle}°`}><input id="qr-ga" type="range" min={0} max={360} step={15} value={d.gradAngle} onChange={e => setD2('gradAngle', +e.target.value)} className="w-full" /></Field>}
              </>)}
              <Field id="qr-bg" title="Background colour"><ColorInput id="qr-bg" value={d.bg} onChange={v => setD2('bg', v)} /></Field>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer self-end pb-2"><input type="checkbox" checked={d.bgTransparent} onChange={e => setD2('bgTransparent', e.target.checked)} /> Transparent background</label>
            </Section>

            <Section title="Corner styles">
              <Field id="qr-cs" title="Corner square"><Select id="qr-cs" value={d.cornerSquareStyle} onChange={v => setD2('cornerSquareStyle', v)} options={CORNER_SQ} /></Field>
              <Field id="qr-csc" title="Corner square colour">
                <div className="flex items-center gap-2"><ColorInput id="qr-csc" value={d.cornerSquareColor ?? d.dotColor} onChange={v => setD2('cornerSquareColor', v)} />
                  {d.cornerSquareColor && <button type="button" onClick={() => setD2('cornerSquareColor', null)} className="text-xs text-gray-500 hover:text-brand-600 cursor-pointer shrink-0">Match dots</button>}</div>
              </Field>
              <Field id="qr-cd" title="Corner dot"><Select id="qr-cd" value={d.cornerDotStyle} onChange={v => setD2('cornerDotStyle', v)} options={CORNER_DOT} /></Field>
              <Field id="qr-cdc" title="Corner dot colour">
                <div className="flex items-center gap-2"><ColorInput id="qr-cdc" value={d.cornerDotColor ?? d.dotColor} onChange={v => setD2('cornerDotColor', v)} />
                  {d.cornerDotColor && <button type="button" onClick={() => setD2('cornerDotColor', null)} className="text-xs text-gray-500 hover:text-brand-600 cursor-pointer shrink-0">Match dots</button>}</div>
              </Field>
            </Section>

            <Section title="Logo">
              <Field id="qr-logo" title="Centre logo (optional)" full>
                <div className="flex items-center gap-2">
                  <input id="qr-logo" type="file" accept="image/*" onChange={e => onLogo(e.target.files?.[0])} className="text-sm w-full min-w-0" />
                  {d.logo && <button type="button" onClick={() => onLogo(undefined)} className="text-sm text-gray-500 hover:text-red-600 cursor-pointer">Remove</button>}
                </div>
              </Field>
              {d.logo && (<>
                <Field id="qr-ls" title={`Logo size: ${Math.round(d.logoSize * 100)}%`}><input id="qr-ls" type="range" min={10} max={40} value={Math.round(d.logoSize * 100)} onChange={e => setD2('logoSize', +e.target.value / 100)} className="w-full" /></Field>
                <Field id="qr-lm" title={`Logo margin: ${d.logoMargin}px`}><input id="qr-lm" type="range" min={0} max={20} value={d.logoMargin} onChange={e => setD2('logoMargin', +e.target.value)} className="w-full" /></Field>
                <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={d.hideLogoDots} onChange={e => setD2('hideLogoDots', e.target.checked)} /> Hide dots behind the logo</label>
                <p className="sm:col-span-2 text-xs text-gray-500">Error correction is set to High (30%) while a logo is used.</p>
              </>)}
            </Section>

            <Section title="Frame and size">
              <Field id="qr-fr" title="Frame">
                <select id="qr-fr" className={input} value={d.frame} onChange={e => setD2('frame', e.target.value as QrDesign['frame'])}>
                  <option value="none">None</option><option value="bottom">Label bar below</option><option value="top">Label bar above</option><option value="outline">Outline with label</option>
                </select>
              </Field>
              {d.frame !== 'none' && (<>
                <Field id="qr-ft" title="Frame text"><input id="qr-ft" className={input} maxLength={30} value={d.frameText} onChange={e => setD2('frameText', e.target.value)} /></Field>
                <Field id="qr-fc" title="Frame colour"><ColorInput id="qr-fc" value={d.frameColor} onChange={v => setD2('frameColor', v)} /></Field>
              </>)}
              <Field id="qr-margin" title={`Quiet zone: ${d.margin} modules`}><input id="qr-margin" type="range" min={0} max={8} value={d.margin} onChange={e => setD2('margin', +e.target.value)} className="w-full" /></Field>
              <Field id="qr-ecc" title="Error correction">
                <select id="qr-ecc" className={input} value={d.logo ? 'H' : d.ecc} disabled={!!d.logo} onChange={e => setD2('ecc', e.target.value as QrEcc)}>
                  <option value="L">Low (7%)</option><option value="M">Medium (15%)</option><option value="Q">Quartile (25%)</option><option value="H">High (30%)</option>
                </select>
              </Field>
              <Field id="qr-size" title={`Image width: ${px}px`}><input id="qr-size" type="range" min={128} max={MAX_PX} step={32} value={size} onChange={e => setSize(+e.target.value)} className="w-full" /></Field>
            </Section>
          </div>

          {warnings.map(w => <p key={w} className={note('text-amber-800 bg-amber-50 border-amber-200 flex gap-2')}><TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />{w}</p>)}
        </div>

        <div className="min-w-0 order-first lg:order-none lg:sticky lg:top-24 self-start">
          <div className="w-full max-w-[300px] mx-auto rounded-xl border border-gray-200 bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%),linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%)] bg-[length:16px_16px] bg-[position:0_0,8px_8px] min-h-[200px] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview ? <img src={preview} alt="QR code preview" className="w-full h-auto" /> : <p className="text-sm text-gray-500 px-4 py-16 text-center bg-gray-50 w-full">{mode === 'bulk' ? 'Add values to preview the first code.' : 'Fill in the details to see your QR code.'}</p>}
          </div>
          <div aria-live="polite" className="mt-3 max-w-[300px] mx-auto min-h-[2.5rem]">
            {hasData && scan === 'ok' && <p className={note('text-emerald-800 bg-emerald-50 border-emerald-200 flex gap-2')}><Check className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />Scans OK. Decoded back to your exact content.</p>}
            {hasData && scan === 'fail' && <p className={note('text-amber-800 bg-amber-50 border-amber-200 flex gap-2')}><TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />May not scan. Increase contrast or error correction, reduce the logo, or shorten the content.</p>}
          </div>
          {error && <p role="alert" className={`mt-2 max-w-[300px] mx-auto ${note('text-red-700 bg-red-50 border-red-200')}`}>{error}</p>}
          {mode === 'single' && (
            <div className="mt-3 max-w-[300px] mx-auto space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {(['png', 'jpg', 'svg', 'pdf'] as const).map(t => (
                  <Button key={t} onClick={() => download(t)} disabled={!hasData || busy} variant={t === 'png' ? 'default' : 'outline'} className="gap-1 px-2 cursor-pointer" aria-label={`Download ${t.toUpperCase()}`}>
                    <Download className="w-4 h-4" aria-hidden />{t.toUpperCase()}
                  </Button>
                ))}
              </div>
              <Button onClick={copy} disabled={!hasData || busy} variant="outline" className="w-full gap-1.5 cursor-pointer">
                {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}{copied ? 'Copied' : 'Copy image'}
              </Button>
              <fieldset className="border-t border-gray-200 pt-3">
                <legend className="text-xs font-medium text-gray-600">PDF print size (300 DPI)</legend>
                <div className="flex gap-2 mt-1">
                  <input aria-label="Print width" type="number" min={1} max={unit === 'cm' ? 30 : 12} step="0.5" className={input} value={printW} onChange={e => setPrintW(Math.max(0.5, +e.target.value || 0.5))} />
                  <select aria-label="Unit" className={`${input} w-20`} value={unit} onChange={e => setUnit(e.target.value as PrintUnit)}><option value="cm">cm</option><option value="in">in</option></select>
                </div>
                <p className="mt-1 text-xs text-gray-500">Page is exactly this wide{d.frame !== 'none' ? ', frame included' : ''}. PNG and JPG use the image width setting.</p>
              </fieldset>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
