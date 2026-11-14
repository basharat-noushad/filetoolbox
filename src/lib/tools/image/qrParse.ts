// Detects what a decoded QR payload is and extracts readable fields. Pure, no DOM.

export interface ParsedQr {
  type: 'url' | 'wifi' | 'vcard' | 'mecard' | 'email' | 'phone' | 'sms' | 'geo' | 'event' | 'upi' | 'bitcoin' | 'text'
  label: string
  fields: [string, string][]
  url?: string // only ever an http(s) link
}

const unesc = (s: string) => s.replace(/\\(.)/g, '$1')

/** Splits on `sep` ignoring backslash-escaped separators. */
function splitEsc(s: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && i + 1 < s.length) { cur += s[i] + s[i + 1]; i++ } else if (s[i] === sep) { out.push(cur); cur = '' } else cur += s[i]
  }
  return [...out, cur]
}

export function parseQr(raw: string): ParsedQr {
  const s = raw.trim()
  if (/^https?:\/\/\S+$/i.test(s)) return { type: 'url', label: 'Web link', fields: [], url: s }

  if (/^WIFI:/i.test(s)) {
    const m: Record<string, string> = {}
    for (const part of splitEsc(s.slice(5), ';')) {
      const i = part.indexOf(':')
      if (i > 0) m[part.slice(0, i).toUpperCase()] = unesc(part.slice(i + 1))
    }
    return { type: 'wifi', label: 'Wi-Fi network', fields: [['Network name', m.S ?? ''], ['Security', m.T || 'none'], ['Password', m.P ?? '(none)'], ['Hidden', m.H === 'true' ? 'Yes' : 'No']] }
  }

  if (/^BEGIN:VCARD/i.test(s)) {
    const f: [string, string][] = []
    const names: Record<string, string> = { FN: 'Name', ORG: 'Organisation', TEL: 'Phone', EMAIL: 'Email', URL: 'Website', ADR: 'Address', TITLE: 'Title', NOTE: 'Note' }
    for (const line of s.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z]+)(?:;[^:]*)?:(.*)$/)
      const label = m && names[m[1].toUpperCase()]
      if (m && label) f.push([label, unesc(m[2]).replace(/;/g, ' ').trim()])
    }
    return { type: 'vcard', label: 'Contact (vCard)', fields: f }
  }

  if (/^MECARD:/i.test(s)) {
    const names: Record<string, string> = { N: 'Name', TEL: 'Phone', EMAIL: 'Email', URL: 'Website', ORG: 'Organisation', ADR: 'Address', NOTE: 'Note' }
    const f: [string, string][] = []
    for (const part of splitEsc(s.slice(7), ';')) {
      const i = part.indexOf(':')
      const label = i > 0 && names[part.slice(0, i).toUpperCase()]
      if (label) f.push([label, unesc(part.slice(i + 1)).replace(/,/g, ', ')])
    }
    return { type: 'mecard', label: 'Contact (MeCard)', fields: f }
  }

  if (/^BEGIN:VCALENDAR|^BEGIN:VEVENT/i.test(s)) {
    const names: Record<string, string> = { SUMMARY: 'Title', DTSTART: 'Starts', DTEND: 'Ends', LOCATION: 'Location', DESCRIPTION: 'Description' }
    const f: [string, string][] = []
    for (const line of s.split(/\r?\n/)) {
      const m = line.match(/^([A-Z]+)(?:;[^:]*)?:(.*)$/)
      if (m && names[m[1]]) f.push([names[m[1]], unesc(m[2]).replace(/\\n/g, '\n')])
    }
    return { type: 'event', label: 'Calendar event', fields: f }
  }

  let m = s.match(/^mailto:([^?]*)(?:\?(.*))?$/i)
  if (m) {
    const q = new URLSearchParams(m[2] ?? '')
    return { type: 'email', label: 'Email', fields: [['To', decodeURIComponent(m[1])], ['Subject', q.get('subject') ?? ''], ['Message', q.get('body') ?? '']].filter(([, v]) => v) as [string, string][] }
  }
  m = s.match(/^tel:(.+)$/i)
  if (m) return { type: 'phone', label: 'Phone number', fields: [['Number', m[1]]] }
  m = s.match(/^smsto?:([^:?]*)[:?]?(.*)$/i)
  if (m) return { type: 'sms', label: 'SMS', fields: [['To', m[1]], ['Message', m[2]]].filter(([, v]) => v) as [string, string][] }
  m = s.match(/^geo:(-?[\d.]+),(-?[\d.]+)/i)
  if (m) return { type: 'geo', label: 'Location', fields: [['Latitude', m[1]], ['Longitude', m[2]]] }
  if (/^upi:\/\/pay\?/i.test(s)) {
    const q = new URLSearchParams(s.split('?')[1])
    return { type: 'upi', label: 'UPI payment', fields: [['UPI ID', q.get('pa') ?? ''], ['Payee', q.get('pn') ?? ''], ['Amount', q.get('am') ?? ''], ['Note', q.get('tn') ?? '']].filter(([, v]) => v) as [string, string][] }
  }
  m = s.match(/^bitcoin:([^?]+)(?:\?(.*))?$/i)
  if (m) {
    const q = new URLSearchParams(m[2] ?? '')
    return { type: 'bitcoin', label: 'Bitcoin payment', fields: [['Address', m[1]], ['Amount', q.get('amount') ?? ''], ['Label', q.get('label') ?? '']].filter(([, v]) => v) as [string, string][] }
  }
  return { type: 'text', label: 'Text', fields: [] }
}
