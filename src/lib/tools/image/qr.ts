import QRCode from 'qrcode'

export type QrKind = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard'
export type QrEcc = 'L' | 'M' | 'Q' | 'H'

export interface QrFields {
  text: string // url / text / phone number / sms number
  ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; hidden: boolean
  email: string; subject: string; body: string
  smsBody: string
  firstName: string; lastName: string; org: string; vPhone: string; vEmail: string; vUrl: string
}

export const emptyFields: QrFields = {
  text: '', ssid: '', password: '', security: 'WPA', hidden: false,
  email: '', subject: '', body: '', smsBody: '',
  firstName: '', lastName: '', org: '', vPhone: '', vEmail: '', vUrl: '',
}

// Wi-Fi spec: escape \ ; , : "
const wifiEsc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1')
// vCard 3.0 text escaping
const vEsc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')

/** Returns the string to encode, or '' when required fields are missing. */
export function buildPayload(kind: QrKind, f: QrFields): string {
  switch (kind) {
    case 'url': case 'text': return f.text.trim() ? f.text : ''
    case 'phone': return f.text.trim() ? `tel:${f.text.trim()}` : ''
    case 'sms': return f.text.trim() ? `SMSTO:${f.text.trim()}:${f.smsBody}` : ''
    case 'wifi':
      if (!f.ssid) return ''
      return `WIFI:T:${f.security};S:${wifiEsc(f.ssid)};${f.security === 'nopass' ? '' : `P:${wifiEsc(f.password)};`}H:${f.hidden};;`
    case 'email': {
      if (!f.email.trim()) return ''
      const q = [f.subject && `subject=${encodeURIComponent(f.subject)}`, f.body && `body=${encodeURIComponent(f.body)}`].filter(Boolean).join('&')
      return `mailto:${f.email.trim()}${q ? `?${q}` : ''}`
    }
    case 'vcard': {
      if (!f.firstName && !f.lastName && !f.org) return ''
      return ['BEGIN:VCARD', 'VERSION:3.0', `N:${vEsc(f.lastName)};${vEsc(f.firstName)};;;`,
        `FN:${vEsc(`${f.firstName} ${f.lastName}`.trim() || f.org)}`,
        f.org && `ORG:${vEsc(f.org)}`, f.vPhone && `TEL:${vEsc(f.vPhone)}`,
        f.vEmail && `EMAIL:${vEsc(f.vEmail)}`, f.vUrl && `URL:${f.vUrl}`, 'END:VCARD'].filter(Boolean).join('\n')
    }
  }
}

export interface QrOptions { size: number; margin: number; fg: string; bg: string; ecc: QrEcc; logo?: HTMLImageElement | null }

const LOGO_FRACTION = 0.2

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

const eccOf = (o: QrOptions): QrEcc => (o.logo ? 'H' : o.ecc)

export async function qrToPng(data: string, o: QrOptions): Promise<Blob> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, data, {
    width: o.size, margin: o.margin, errorCorrectionLevel: eccOf(o), color: { dark: o.fg, light: o.bg },
  })
  if (o.logo) {
    const ctx = canvas.getContext('2d')!
    const box = Math.round(canvas.width * LOGO_FRACTION)
    const pad = Math.round(box * 0.1)
    const x = Math.round((canvas.width - box) / 2)
    ctx.fillStyle = o.bg
    ctx.fillRect(x - pad, x - pad, box + pad * 2, box + pad * 2)
    const s = Math.min(box / (o.logo.naturalWidth || 1), box / (o.logo.naturalHeight || 1))
    const w = (o.logo.naturalWidth || box) * s, h = (o.logo.naturalHeight || box) * s
    ctx.drawImage(o.logo, x + (box - w) / 2, x + (box - h) / 2, w, h)
  }
  return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('PNG export failed'))), 'image/png'))
}

export async function qrToSvg(data: string, o: QrOptions, logoDataUrl?: string | null): Promise<Blob> {
  let svg = await QRCode.toString(data, {
    type: 'svg', width: o.size, margin: o.margin, errorCorrectionLevel: eccOf(o), color: { dark: o.fg, light: o.bg },
  })
  if (logoDataUrl && o.logo) {
    const box = o.size * LOGO_FRACTION, pad = box * 0.1
    const s = Math.min(box / (o.logo.naturalWidth || 1), box / (o.logo.naturalHeight || 1))
    const w = (o.logo.naturalWidth || box) * s, h = (o.logo.naturalHeight || box) * s
    const x = (o.size - box) / 2
    // qrcode's SVG viewBox is in module units; scale pixel coordinates into it
    const vb = svg.match(/viewBox="0 0 (\d+) \d+"/)
    const k = vb ? parseInt(vb[1], 10) / o.size : 1
    const g = `<g transform="scale(${k})"><rect x="${x - pad}" y="${x - pad}" width="${box + pad * 2}" height="${box + pad * 2}" fill="${o.bg}"/>` +
      `<image x="${x + (box - w) / 2}" y="${x + (box - h) / 2}" width="${w}" height="${h}" href="${logoDataUrl}"/></g>`
    svg = svg.replace('</svg>', `${g}</svg>`)
  }
  return new Blob([svg], { type: 'image/svg+xml' })
}
