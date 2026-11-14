'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buildPayload, contrastRatio, emptyFields, qrToPng, qrToSvg,
  type QrEcc, type QrFields, type QrKind,
} from '@/lib/tools/image/qr'

const KINDS: { id: QrKind; label: string }[] = [
  { id: 'url', label: 'URL' }, { id: 'text', label: 'Text' }, { id: 'wifi', label: 'Wi-Fi' },
  { id: 'email', label: 'Email' }, { id: 'phone', label: 'Phone' }, { id: 'sms', label: 'SMS' }, { id: 'vcard', label: 'Contact' },
]

const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500'
const label = 'block text-sm font-medium text-gray-700 mb-1'

function Field({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className={label}>{title}</label>{children}</div>
}

export function QrCodeGeneratorClient() {
  const [kind, setKind] = useState<QrKind>('url')
  const [f, setF] = useState<QrFields>(emptyFields)
  const [size, setSize] = useState(512)
  const [margin, setMargin] = useState(2)
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')
  const [ecc, setEcc] = useState<QrEcc>('M')
  const [logo, setLogo] = useState<HTMLImageElement | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const prevUrl = useRef<string | null>(null)

  const set = <K extends keyof QrFields>(k: K, v: QrFields[K]) => setF(p => ({ ...p, [k]: v }))
  const payload = useMemo(() => buildPayload(kind, f), [kind, f])
  const ratio = contrastRatio(fg, bg)
  const lowContrast = ratio < 3 || contrastRatio(fg, '#ffffff') < contrastRatio(bg, '#ffffff') // dark-on-light is the reliable case
  const opts = { size, margin, fg, bg, ecc, logo }

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      if (!payload) { setPreview(null); setError(null); return }
      try {
        const blob = await qrToPng(payload, { ...opts, size: Math.min(size, 640) })
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
        prevUrl.current = url
        setPreview(url); setError(null)
      } catch {
        if (!cancelled) { setPreview(null); setError('That content is too long to fit in a QR code. Shorten it or lower the error correction.') }
      }
    }, 150)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, size, margin, fg, bg, ecc, logo])

  useEffect(() => () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current) }, [])

  const onLogo = (file: File | undefined) => {
    if (!file) { setLogo(null); setLogoUrl(null); return }
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)
      const img = new Image()
      img.onload = () => { setLogo(img); setLogoUrl(url) }
      img.onerror = () => setError('Could not read that logo image.')
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  const download = async (type: 'png' | 'svg') => {
    setBusy(true)
    try {
      const blob = type === 'png' ? await qrToPng(payload, opts) : await qrToSvg(payload, opts, logoUrl)
      saveAs(blob, `qr-code.${type}`)
    } catch {
      setError('Could not create the file. Please try different content or settings.')
    } finally { setBusy(false) }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
      <div role="tablist" aria-label="Content type" className="flex flex-wrap gap-2 mb-5">
        {KINDS.map(k => (
          <button key={k.id} role="tab" aria-selected={kind === k.id} onClick={() => setKind(k.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${kind === k.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'}`}>
            {k.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-4 min-w-0">
          {(kind === 'url' || kind === 'text') && (
            <Field id="qr-text" title={kind === 'url' ? 'Website address' : 'Text'}>
              {kind === 'url'
                ? <input id="qr-text" className={input} type="url" placeholder="https://example.com" value={f.text} onChange={e => set('text', e.target.value)} />
                : <textarea id="qr-text" className={input} rows={4} value={f.text} onChange={e => set('text', e.target.value)} />}
            </Field>
          )}
          {kind === 'phone' && (
            <Field id="qr-phone" title="Phone number"><input id="qr-phone" className={input} type="tel" placeholder="+1 555 010 4477" value={f.text} onChange={e => set('text', e.target.value)} /></Field>
          )}
          {kind === 'sms' && (<>
            <Field id="qr-sms" title="Phone number"><input id="qr-sms" className={input} type="tel" value={f.text} onChange={e => set('text', e.target.value)} /></Field>
            <Field id="qr-smsb" title="Message"><textarea id="qr-smsb" className={input} rows={3} value={f.smsBody} onChange={e => set('smsBody', e.target.value)} /></Field>
          </>)}
          {kind === 'email' && (<>
            <Field id="qr-email" title="Email address"><input id="qr-email" className={input} type="email" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field id="qr-subj" title="Subject (optional)"><input id="qr-subj" className={input} value={f.subject} onChange={e => set('subject', e.target.value)} /></Field>
            <Field id="qr-body" title="Message (optional)"><textarea id="qr-body" className={input} rows={3} value={f.body} onChange={e => set('body', e.target.value)} /></Field>
          </>)}
          {kind === 'wifi' && (<>
            <Field id="qr-ssid" title="Network name (SSID)"><input id="qr-ssid" className={input} value={f.ssid} onChange={e => set('ssid', e.target.value)} /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="qr-sec" title="Security">
                <select id="qr-sec" className={input} value={f.security} onChange={e => set('security', e.target.value as QrFields['security'])}>
                  <option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">None (open network)</option>
                </select>
              </Field>
              {f.security !== 'nopass' && <Field id="qr-pass" title="Password"><input id="qr-pass" className={input} value={f.password} onChange={e => set('password', e.target.value)} /></Field>}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={f.hidden} onChange={e => set('hidden', e.target.checked)} /> Hidden network</label>
          </>)}
          {kind === 'vcard' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="qr-fn" title="First name"><input id="qr-fn" className={input} value={f.firstName} onChange={e => set('firstName', e.target.value)} /></Field>
              <Field id="qr-ln" title="Last name"><input id="qr-ln" className={input} value={f.lastName} onChange={e => set('lastName', e.target.value)} /></Field>
              <Field id="qr-org" title="Organisation"><input id="qr-org" className={input} value={f.org} onChange={e => set('org', e.target.value)} /></Field>
              <Field id="qr-vp" title="Phone"><input id="qr-vp" className={input} type="tel" value={f.vPhone} onChange={e => set('vPhone', e.target.value)} /></Field>
              <Field id="qr-ve" title="Email"><input id="qr-ve" className={input} type="email" value={f.vEmail} onChange={e => set('vEmail', e.target.value)} /></Field>
              <Field id="qr-vu" title="Website"><input id="qr-vu" className={input} value={f.vUrl} onChange={e => set('vUrl', e.target.value)} /></Field>
            </div>
          )}

          <fieldset className="border-t border-gray-200 pt-4 grid sm:grid-cols-2 gap-4">
            <legend className="sr-only">Appearance</legend>
            <Field id="qr-size" title={`Size: ${size}px`}><input id="qr-size" type="range" min={128} max={2048} step={64} value={size} onChange={e => setSize(+e.target.value)} className="w-full" /></Field>
            <Field id="qr-margin" title={`Margin: ${margin} modules`}><input id="qr-margin" type="range" min={0} max={8} value={margin} onChange={e => setMargin(+e.target.value)} className="w-full" /></Field>
            <Field id="qr-fg" title="Foreground"><input id="qr-fg" type="color" value={fg} onChange={e => setFg(e.target.value)} className="h-9 w-full rounded border border-gray-300 cursor-pointer" /></Field>
            <Field id="qr-bg" title="Background"><input id="qr-bg" type="color" value={bg} onChange={e => setBg(e.target.value)} className="h-9 w-full rounded border border-gray-300 cursor-pointer" /></Field>
            <Field id="qr-ecc" title="Error correction">
              <select id="qr-ecc" className={input} value={logo ? 'H' : ecc} disabled={!!logo} onChange={e => setEcc(e.target.value as QrEcc)}>
                <option value="L">Low (7%)</option><option value="M">Medium (15%)</option><option value="Q">Quartile (25%)</option><option value="H">High (30%)</option>
              </select>
            </Field>
            <Field id="qr-logo" title="Centre logo (optional)">
              <div className="flex items-center gap-2">
                <input id="qr-logo" type="file" accept="image/*" onChange={e => onLogo(e.target.files?.[0])} className="text-sm w-full min-w-0" />
                {logo && <button type="button" onClick={() => onLogo(undefined)} className="text-sm text-gray-500 hover:text-red-600 cursor-pointer">Remove</button>}
              </div>
            </Field>
          </fieldset>
          {logo && <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">Logo added at about 20% of the width and error correction set to High. Test-scan before printing.</p>}
          {lowContrast && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Low contrast: many scanners need a dark code on a light background (contrast ratio now {ratio.toFixed(1)}:1).</p>}
        </div>

        <div className="min-w-0">
          <div className="aspect-square w-full max-w-[280px] mx-auto rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview ? <img src={preview} alt="QR code preview" className="w-full h-full object-contain" /> : <p className="text-sm text-gray-500 px-4 text-center">Fill in the details to see your QR code.</p>}
          </div>
          {error && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2 max-w-[280px] mx-auto">
            <Button onClick={() => download('png')} disabled={!preview || busy} className="gap-1.5 cursor-pointer"><Download className="w-4 h-4" />PNG</Button>
            <Button onClick={() => download('svg')} disabled={!preview || busy} variant="outline" className="gap-1.5 cursor-pointer"><Download className="w-4 h-4" />SVG</Button>
          </div>
          <p className="mt-3 text-xs text-gray-500 max-w-[280px] mx-auto">Static code: no tracking, no account and no expiry. Your content is encoded in the image itself.</p>
        </div>
      </div>
    </div>
  )
}
