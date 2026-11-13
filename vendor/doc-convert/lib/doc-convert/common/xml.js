// Tiny namespace-agnostic XML helpers (OOXML always uses stable prefixes like w:, a:, r:).
import { DOMParser } from '@xmldom/xmldom';

export function parseXml(text) {
  return new DOMParser({ onError: () => {} }).parseFromString(text, 'text/xml');
}

export function kids(el, name) {
  const out = [];
  if (!el) return out;
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 1 && (!name || n.localName === name)) out.push(n);
  }
  return out;
}

export function kid(el, name) {
  if (!el) return null;
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === 1 && n.localName === name) return n;
  }
  return null;
}

export function descendants(el, name) {
  if (!el) return [];
  return Array.from(el.getElementsByTagNameNS('*', name));
}

export function attr(el, qname) {
  if (!el || !el.hasAttribute || !el.hasAttribute(qname)) return null;
  return el.getAttribute(qname);
}

/** w:val style attribute read */
export const wv = (el, name = 'val') => attr(el, 'w:' + name);

/** OOXML on/off toggle: <w:b/> = true, <w:b w:val="0"/> = false, missing = undefined */
export function onOff(el) {
  if (!el) return undefined;
  const v = wv(el);
  if (v == null) return true;
  return !(v === '0' || v === 'false' || v === 'off');
}

export const num = (v, d = 0) => {
  if (v == null || v === '') return d;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : d;
};
