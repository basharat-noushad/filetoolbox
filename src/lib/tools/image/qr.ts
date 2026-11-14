// Content payload builders for the QR generator. Pure functions, no DOM.

export type QrKind =
  | 'url' | 'text' | 'wifi' | 'vcard' | 'mecard' | 'email' | 'phone' | 'sms' | 'whatsapp'
  | 'location' | 'event' | 'meeting' | 'social' | 'app' | 'upi' | 'paypal' | 'bitcoin'
export type QrEcc = 'L' | 'M' | 'Q' | 'H'
export type QrFields = Record<string, string>

export interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'url' | 'tel' | 'email' | 'textarea' | 'select' | 'checkbox' | 'datetime-local' | 'date' | 'number'
  placeholder?: string
  options?: [string, string][]
  hint?: string
  half?: boolean
  show?: (f: QrFields) => boolean
}
export interface PayloadResult { data: string; error?: string }

export const KIND_GROUPS: { label: string; kinds: { id: QrKind; label: string }[] }[] = [
  { label: 'Basics', kinds: [{ id: 'url', label: 'URL' }, { id: 'text', label: 'Text' }, { id: 'wifi', label: 'Wi-Fi' }, { id: 'vcard', label: 'vCard' }, { id: 'mecard', label: 'MeCard' }] },
  { label: 'Messaging', kinds: [{ id: 'email', label: 'Email' }, { id: 'phone', label: 'Phone' }, { id: 'sms', label: 'SMS' }, { id: 'whatsapp', label: 'WhatsApp' }] },
  { label: 'Places & time', kinds: [{ id: 'location', label: 'Location' }, { id: 'event', label: 'Calendar' }, { id: 'meeting', label: 'Meeting' }] },
  { label: 'Social & apps', kinds: [{ id: 'social', label: 'Social profile' }, { id: 'app', label: 'App store' }] },
  { label: 'Payments', kinds: [{ id: 'upi', label: 'UPI' }, { id: 'paypal', label: 'PayPal.me' }, { id: 'bitcoin', label: 'Bitcoin' }] },
]

const opt = (...v: string[]): [string, string][] => v.map(x => [x, x])

export const FORMS: Record<QrKind, FieldDef[]> = {
  url: [
    { key: 'url', label: 'Website address', type: 'url', placeholder: 'https://example.com' },
    { key: 'utm_source', label: 'utm_source (optional)', half: true, placeholder: 'newsletter' },
    { key: 'utm_medium', label: 'utm_medium (optional)', half: true, placeholder: 'qr' },
    { key: 'utm_campaign', label: 'utm_campaign (optional)', half: true, placeholder: 'spring-sale' },
  ],
  text: [{ key: 'text', label: 'Text', type: 'textarea' }],
  wifi: [
    { key: 'ssid', label: 'Network name (SSID)' },
    { key: 'security', label: 'Security', type: 'select', half: true, options: [['WPA', 'WPA / WPA2 / WPA3'], ['WEP', 'WEP'], ['nopass', 'None (open network)']] },
    { key: 'password', label: 'Password', half: true, show: f => f.security !== 'nopass' },
    { key: 'hidden', label: 'Hidden network', type: 'checkbox' },
  ],
  vcard: [
    { key: 'firstName', label: 'First name', half: true }, { key: 'lastName', label: 'Last name', half: true },
    { key: 'org', label: 'Organisation', half: true }, { key: 'vPhone', label: 'Phone', type: 'tel', half: true },
    { key: 'vEmail', label: 'Email', type: 'email', half: true }, { key: 'vUrl', label: 'Website', half: true },
  ],
  mecard: [
    { key: 'mFirst', label: 'First name', half: true }, { key: 'mLast', label: 'Last name', half: true },
    { key: 'mPhone', label: 'Phone', type: 'tel', half: true }, { key: 'mEmail', label: 'Email', type: 'email', half: true },
    { key: 'mUrl', label: 'Website', half: true }, { key: 'mOrg', label: 'Organisation', half: true },
    { key: 'mAddr', label: 'Address (optional)' }, { key: 'mNote', label: 'Note (optional)' },
  ],
  email: [
    { key: 'email', label: 'Email address', type: 'email' },
    { key: 'subject', label: 'Subject (optional)' },
    { key: 'body', label: 'Message (optional)', type: 'textarea' },
  ],
  phone: [{ key: 'phone', label: 'Phone number', type: 'tel', placeholder: '+1 555 010 4477' }],
  sms: [
    { key: 'smsTo', label: 'Phone number', type: 'tel' },
    { key: 'smsBody', label: 'Message', type: 'textarea' },
  ],
  whatsapp: [
    { key: 'waNumber', label: 'WhatsApp number with country code', type: 'tel', placeholder: '+91 98765 43210' },
    { key: 'waText', label: 'Pre-filled message (optional)', type: 'textarea' },
  ],
  location: [
    { key: 'locInput', label: 'Coordinates or a Google Maps link', placeholder: '48.8584, 2.2945 or https://www.google.com/maps/@48.8584,2.2945,15z', hint: 'Paste a full Maps link and the coordinates are read from it.' },
    { key: 'locMode', label: 'Encode as', type: 'select', options: [['geo', 'geo: location (opens the default maps app)'], ['maps', 'Google Maps link']] },
  ],
  event: [
    { key: 'evTitle', label: 'Event title' },
    { key: 'evAllDay', label: 'All-day event', type: 'checkbox' },
    { key: 'evStart', label: 'Starts', type: 'datetime-local', half: true, show: f => !f.evAllDay },
    { key: 'evEnd', label: 'Ends (optional)', type: 'datetime-local', half: true, show: f => !f.evAllDay },
    { key: 'evStartD', label: 'Date', type: 'date', half: true, show: f => !!f.evAllDay },
    { key: 'evEndD', label: 'Last day (optional)', type: 'date', half: true, show: f => !!f.evAllDay },
    { key: 'evLoc', label: 'Location (optional)' },
    { key: 'evDesc', label: 'Description (optional)', type: 'textarea' },
  ],
  meeting: [
    { key: 'mtLink', label: 'Meeting link or Zoom meeting ID', placeholder: 'https://zoom.us/j/123456789 or 123 456 7890', hint: 'Zoom, Google Meet, Teams and any other https meeting link work.' },
    { key: 'mtPass', label: 'Zoom passcode (only used with a meeting ID)', show: f => /^[\d\s-]+$/.test((f.mtLink ?? '').trim()) && !!(f.mtLink ?? '').trim() },
  ],
  social: [
    { key: 'soPlatform', label: 'Platform', type: 'select', half: true, options: [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['youtube', 'YouTube'], ['x', 'X (Twitter)'], ['linkedin', 'LinkedIn'], ['tiktok', 'TikTok']] },
    { key: 'soUser', label: 'Username or profile link', half: true, placeholder: '@yourname' },
  ],
  app: [{ key: 'appUrl', label: 'App Store or Google Play link', type: 'url', placeholder: 'https://apps.apple.com/app/... or https://play.google.com/store/apps/details?id=...', hint: 'You can also type an Android package name such as com.example.app.' }],
  upi: [
    { key: 'upiId', label: 'UPI ID', half: true, placeholder: 'name@bank' }, { key: 'upiName', label: 'Payee name', half: true },
    { key: 'upiAmt', label: 'Amount in INR (optional)', type: 'number', half: true }, { key: 'upiNote', label: 'Note (optional)', half: true },
  ],
  paypal: [
    { key: 'ppUser', label: 'PayPal.me username', half: true, placeholder: 'yourname' },
    { key: 'ppAmt', label: 'Amount (optional)', type: 'number', half: true },
    { key: 'ppCur', label: 'Currency', type: 'select', half: true, options: opt('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY') },
  ],
  bitcoin: [
    { key: 'btcAddr', label: 'Bitcoin address' },
    { key: 'btcAmt', label: 'Amount in BTC (optional)', half: true }, { key: 'btcLabel', label: 'Label (optional)', half: true },
    { key: 'btcMsg', label: 'Message (optional)' },
  ],
}

export const defaultFields = (): QrFields => ({
  security: 'WPA', locMode: 'geo', soPlatform: 'instagram', ppCur: 'USD',
})

const t = (f: QrFields, k: string) => (f[k] ?? '').trim()
const ok = (data: string): PayloadResult => ({ data })
const bad = (error: string): PayloadResult => ({ data: '', error })
const EMPTY = ok('')
const enc = encodeURIComponent

// Wi-Fi spec: escape \ ; , : "
const wifiEsc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')
// vCard 3.0 / iCalendar text escaping
const vEsc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1')
// MeCard escaping: \ ; : ,
const mEsc = (s: string) => s.replace(/([\\;:,])/g, '\\$1')

const HTTP = /^https?:\/\//i
const withScheme = (u: string) => (/^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`)
function validHttp(u: string): boolean {
  try { return /^https?:$/.test(new URL(u).protocol) } catch { return false }
}

/** "YYYY-MM-DDTHH:mm" (local) -> "YYYYMMDDTHHMMSSZ" (UTC). */
export function toIcsUtc(local: string): string | null {
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}
const icsDate = (d: string) => d.replace(/-/g, '')
function nextDay(d: string): string {
  const [y, m, dd] = d.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, dd + 1)).toISOString().slice(0, 10)
}

const NUM = String.raw`-?\d+(?:\.\d+)?`
/** Latitude/longitude as the original strings, from "lat,lng" or a Google Maps URL. */
export function coordsFrom(s: string): [string, string] | null {
  const m = s.match(new RegExp(`!3d(${NUM})!4d(${NUM})`))
    || s.match(new RegExp(`@(${NUM}),(${NUM})`))
    || s.match(new RegExp(`[?&](?:q|ll|query|center|destination)=(${NUM})(?:,|%2C)(${NUM})`, 'i'))
    || s.match(new RegExp(`^\\s*(${NUM})\\s*[,;\\s]\\s*(${NUM})\\s*$`))
  if (!m) return null
  const [a, b] = [parseFloat(m[1]), parseFloat(m[2])]
  return Math.abs(a) <= 90 && Math.abs(b) <= 180 ? [m[1], m[2]] : null
}

const SOCIAL: Record<string, { base: string; at: boolean }> = {
  instagram: { base: 'https://www.instagram.com/', at: false },
  facebook: { base: 'https://www.facebook.com/', at: false },
  youtube: { base: 'https://www.youtube.com/', at: true },
  x: { base: 'https://x.com/', at: false },
  linkedin: { base: 'https://www.linkedin.com/in/', at: false },
  tiktok: { base: 'https://www.tiktok.com/', at: true },
}

/** Returns the string to encode. Empty data without an error means "still waiting for input". */
export function buildPayload(kind: QrKind, f: QrFields): PayloadResult {
  switch (kind) {
    case 'url': {
      let u = t(f, 'url')
      if (!u) return EMPTY
      u = withScheme(u)
      if (!validHttp(u)) return bad('Enter a valid web address starting with http:// or https://.')
      const utm = ['source', 'medium', 'campaign'].map(k => [`utm_${k}`, t(f, `utm_${k}`)]).filter(([, v]) => v)
      if (utm.length) {
        const h = u.indexOf('#')
        const [base, hash] = h < 0 ? [u, ''] : [u.slice(0, h), u.slice(h)]
        u = base + (base.includes('?') ? '&' : '?') + utm.map(([k, v]) => `${k}=${enc(v)}`).join('&') + hash
      }
      return ok(u)
    }
    case 'text': return f.text?.trim() ? ok(f.text) : EMPTY
    case 'phone': {
      const p = t(f, 'phone')
      if (!p) return EMPTY
      const n = p.replace(/[\s().-]/g, '')
      return /^\+?\d{3,15}$/.test(n) ? ok(`tel:${n}`) : bad('Enter a valid phone number (digits, optional leading +).')
    }
    case 'sms': {
      const n = t(f, 'smsTo').replace(/[\s().-]/g, '')
      if (!n) return EMPTY
      return /^\+?\d{3,15}$/.test(n) ? ok(`SMSTO:${n}:${f.smsBody ?? ''}`) : bad('Enter a valid phone number.')
    }
    case 'wifi': {
      if (!f.ssid) return EMPTY
      const sec = f.security || 'WPA'
      if (sec !== 'nopass' && !f.password) return bad('Enter the Wi-Fi password, or choose "None" for an open network.')
      return ok(`WIFI:T:${sec};S:${wifiEsc(f.ssid)};${sec === 'nopass' ? '' : `P:${wifiEsc(f.password)};`}H:${f.hidden ? 'true' : 'false'};;`)
    }
    case 'email': {
      const e = t(f, 'email')
      if (!e) return EMPTY
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return bad('Enter a valid email address.')
      const q = [f.subject && `subject=${enc(f.subject)}`, f.body && `body=${enc(f.body)}`].filter(Boolean).join('&')
      return ok(`mailto:${e}${q ? `?${q}` : ''}`)
    }
    case 'vcard': {
      if (!f.firstName && !f.lastName && !f.org) return EMPTY
      return ok(['BEGIN:VCARD', 'VERSION:3.0', `N:${vEsc(f.lastName ?? '')};${vEsc(f.firstName ?? '')};;;`,
        `FN:${vEsc(`${f.firstName ?? ''} ${f.lastName ?? ''}`.trim() || f.org)}`,
        f.org && `ORG:${vEsc(f.org)}`, f.vPhone && `TEL:${vEsc(f.vPhone)}`,
        f.vEmail && `EMAIL:${vEsc(f.vEmail)}`, f.vUrl && `URL:${f.vUrl}`, 'END:VCARD'].filter(Boolean).join('\n'))
    }
    case 'mecard': {
      if (!f.mFirst && !f.mLast && !f.mOrg) return EMPTY
      const name = f.mLast ? `${mEsc(f.mLast)},${mEsc(f.mFirst ?? '')}` : mEsc(f.mFirst ?? f.mOrg)
      const parts = [`N:${name}`, f.mPhone && `TEL:${mEsc(f.mPhone)}`, f.mEmail && `EMAIL:${mEsc(f.mEmail)}`,
        f.mUrl && `URL:${mEsc(f.mUrl)}`, f.mOrg && `ORG:${mEsc(f.mOrg)}`, f.mAddr && `ADR:${mEsc(f.mAddr)}`, f.mNote && `NOTE:${mEsc(f.mNote)}`]
      return ok(`MECARD:${parts.filter(Boolean).join(';')};;`)
    }
    case 'whatsapp': {
      const n = t(f, 'waNumber').replace(/[\s().+-]/g, '')
      if (!n) return EMPTY
      if (!/^\d{6,15}$/.test(n)) return bad('Enter the number with country code, 6 to 15 digits (for example +91 98765 43210).')
      return ok(`https://wa.me/${n}${f.waText ? `?text=${enc(f.waText)}` : ''}`)
    }
    case 'location': {
      const s = t(f, 'locInput')
      if (!s) return EMPTY
      const isUrl = HTTP.test(s)
      if (isUrl && f.locMode === 'maps') return validHttp(s) ? ok(s) : bad('That link is not valid.')
      const c = coordsFrom(s)
      if (!c) return bad(isUrl ? 'Could not find coordinates in that link (short links hide them). Open it in Maps, copy the full address-bar link, or paste "lat, lng".' : 'Enter coordinates like "48.8584, 2.2945" (latitude within ±90, longitude within ±180).')
      return ok(f.locMode === 'maps' ? `https://www.google.com/maps?q=${c[0]},${c[1]}` : `geo:${c[0]},${c[1]}`)
    }
    case 'event': {
      const title = t(f, 'evTitle')
      const allDay = !!f.evAllDay
      const s = t(f, allDay ? 'evStartD' : 'evStart')
      if (!title && !s) return EMPTY
      if (!title) return bad('Enter an event title.')
      if (!s) return bad('Choose a start date.')
      let start: string | null, end: string | null
      if (allDay) {
        const e = t(f, 'evEndD') || s
        if (e < s) return bad('The last day cannot be before the start date.')
        start = icsDate(s); end = icsDate(nextDay(e))
      } else {
        start = toIcsUtc(s)
        const eRaw = t(f, 'evEnd') || new Date(new Date(s).getTime() + 3_600_000).toISOString()
        end = toIcsUtc(eRaw)
        if (!start || !end) return bad('Enter a valid date and time.')
        if (end <= start) return bad('The end time must be after the start time.')
      }
      const d = allDay ? ';VALUE=DATE' : ''
      return ok(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PDF and Image +//QR//EN', 'BEGIN:VEVENT',
        `DTSTAMP:${allDay ? `${start}T000000Z` : start}`, `DTSTART${d}:${start}`, `DTEND${d}:${end}`,
        `SUMMARY:${vEsc(title)}`, f.evLoc && `LOCATION:${vEsc(f.evLoc)}`, f.evDesc && `DESCRIPTION:${vEsc(f.evDesc)}`,
        'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n'))
    }
    case 'meeting': {
      const s = t(f, 'mtLink')
      if (!s) return EMPTY
      if (/^[\d\s-]+$/.test(s)) {
        const id = s.replace(/\D/g, '')
        if (id.length < 9 || id.length > 11) return bad('A Zoom meeting ID has 9 to 11 digits.')
        const pwd = t(f, 'mtPass')
        return ok(`https://zoom.us/j/${id}${pwd ? `?pwd=${enc(pwd)}` : ''}`)
      }
      const u = withScheme(s)
      return validHttp(u) ? ok(u) : bad('Enter a valid meeting link (https://...) or a Zoom meeting ID.')
    }
    case 'social': {
      const raw = t(f, 'soUser')
      if (!raw) return EMPTY
      if (HTTP.test(raw)) return validHttp(raw) ? ok(raw) : bad('That link is not valid.')
      const p = SOCIAL[f.soPlatform || 'instagram']
      const user = raw.replace(/^@/, '')
      if (!/^[A-Za-z0-9._-]{1,100}$/.test(user)) return bad('Usernames can only contain letters, numbers, dots, dashes and underscores.')
      return ok(`${p.base}${p.at ? '@' : ''}${user}`)
    }
    case 'app': {
      const s = t(f, 'appUrl')
      if (!s) return EMPTY
      if (/^[a-z][\w]*(\.[\w]+)+$/i.test(s)) return ok(`https://play.google.com/store/apps/details?id=${s}`)
      const u = withScheme(s)
      if (!validHttp(u)) return bad('Enter an App Store or Google Play link.')
      const host = new URL(u).hostname.replace(/^www\./, '')
      return ['apps.apple.com', 'itunes.apple.com', 'play.google.com'].includes(host) ? ok(u) : bad('That is not an App Store or Google Play link.')
    }
    case 'upi': {
      const pa = t(f, 'upiId')
      if (!pa) return EMPTY
      if (!/^[\w.-]{2,}@[A-Za-z][\w.-]*$/.test(pa)) return bad('Enter a valid UPI ID such as name@bank.')
      const am = t(f, 'upiAmt')
      if (am && !/^\d+(\.\d{1,2})?$/.test(am)) return bad('Enter the amount as a number with up to 2 decimals.')
      const q = [`pa=${pa}`, f.upiName && `pn=${enc(f.upiName.trim())}`, am && `am=${am}`, 'cu=INR', f.upiNote && `tn=${enc(f.upiNote.trim())}`]
      return ok(`upi://pay?${q.filter(Boolean).join('&')}`)
    }
    case 'paypal': {
      const u = t(f, 'ppUser').replace(/^(https?:\/\/)?(www\.)?paypal\.me\//i, '')
      if (!u) return EMPTY
      if (!/^[A-Za-z0-9]{1,20}$/.test(u)) return bad('PayPal.me usernames are letters and numbers only.')
      const am = t(f, 'ppAmt')
      if (am && !/^\d+(\.\d{1,2})?$/.test(am)) return bad('Enter the amount as a number with up to 2 decimals.')
      return ok(`https://paypal.me/${u}${am ? `/${am}${f.ppCur || 'USD'}` : ''}`)
    }
    case 'bitcoin': {
      const a = t(f, 'btcAddr')
      if (!a) return EMPTY
      if (!/^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{11,87})$/i.test(a)) return bad('That does not look like a Bitcoin address (starts with 1, 3 or bc1).')
      const am = t(f, 'btcAmt')
      if (am && !/^\d+(\.\d{1,8})?$/.test(am)) return bad('Enter the amount in BTC with up to 8 decimals.')
      const q = [am && `amount=${am}`, f.btcLabel && `label=${enc(f.btcLabel.trim())}`, f.btcMsg && `message=${enc(f.btcMsg.trim())}`].filter(Boolean).join('&')
      return ok(`bitcoin:${a}${q ? `?${q}` : ''}`)
    }
  }
}

/** WCAG contrast ratio of two #rrggbb colours. */
export function contrastRatio(a: string, b: string): number {
  const lum = (h: string) => {
    const [r, g, bl] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
