'use client'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const SUBJECTS = ['General', 'Bug report', 'Tool request', 'Privacy', 'Business'] as const
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,63}$/
const inputCls = 'scroll-mt-32 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 aria-[invalid=true]:border-red-400'

type Field = 'name' | 'email' | 'subject' | 'message'
type Errors = Partial<Record<Field, string>>

function validate(v: Record<Field, string>): Errors {
  const e: Errors = {}
  if (!v.name.trim()) e.name = 'Please enter your name.'
  else if (v.name.trim().length > 100) e.name = 'Name must be 100 characters or fewer.'
  if (v.email.trim().length > 254 || !EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  if (!SUBJECTS.includes(v.subject as typeof SUBJECTS[number])) e.subject = 'Please choose a topic.'
  const m = v.message.trim().length
  if (m < 10) e.message = 'Please write at least 10 characters.'
  else if (m > 5000) e.message = 'Message must be 5,000 characters or fewer.'
  return e
}

export function ContactForm() {
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', subject: 'General', message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)
  const startedAt = useRef(0)
  const honeypot = useRef<HTMLInputElement>(null)

  useEffect(() => { startedAt.current = performance.now() }, [])

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setValues(v => ({ ...v, [k]: e.target.value }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }))
    setServerError(null)
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(`cf-${Object.keys(found)[0]}`)?.focus()
      return
    }
    setStatus('sending'); setServerError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, website: honeypot.current?.value ?? '', elapsed: Math.round(performance.now() - startedAt.current) }),
      })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) { setStatus('sent'); return }
      setServerError(data.error || 'Something went wrong. Please try again or email us directly.')
    } catch {
      setServerError('Network error. Check your connection and try again, or email us directly.')
    }
    setStatus('idle')
  }

  if (status === 'sent') {
    return (
      <div role="status" className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" aria-hidden />
        <p className="font-semibold text-emerald-900 mb-1">Thanks — your message has been sent.</p>
        <p className="text-sm text-emerald-700">We&apos;ll reply to <span className="font-medium break-all">{values.email.trim()}</span>, usually within 1–2 business days.</p>
      </div>
    )
  }

  const err = (k: Field) => errors[k] && <p id={`cf-${k}-err`} className="mt-1 text-xs text-red-600">{errors[k]}</p>
  const aria = (k: Field) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `cf-${k}-err` : undefined })

  return (
    <form onSubmit={onSubmit} noValidate className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cf-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input id="cf-name" name="name" autoComplete="name" maxLength={100} value={values.name} onChange={set('name')} className={inputCls} {...aria('name')} />
          {err('name')}
        </div>
        <div>
          <label htmlFor="cf-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input id="cf-email" name="email" type="email" autoComplete="email" maxLength={254} value={values.email} onChange={set('email')} className={inputCls} {...aria('email')} />
          {err('email')}
        </div>
      </div>
      <div>
        <label htmlFor="cf-subject" className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
        <select id="cf-subject" name="subject" value={values.subject} onChange={set('subject')} className={inputCls} {...aria('subject')}>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {err('subject')}
      </div>
      <div>
        <label htmlFor="cf-message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea id="cf-message" name="message" rows={6} maxLength={5000} value={values.message} onChange={set('message')}
          className={`${inputCls} resize-y`} {...aria('message')}
          placeholder="For bugs, tell us which tool, your browser, and what happened." />
        <div className="flex justify-between gap-3">
          {err('message') || <span />}
          <span className="mt-1 text-xs text-gray-400 tabular-nums">{values.message.length}/5000</span>
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots that fill it get a fake success. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="cf-website">Website</label>
        <input id="cf-website" name="website" ref={honeypot} tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {serverError} <a href="mailto:contact@pdfandimage.com" className="font-medium underline">contact@pdfandimage.com</a>
        </p>
      )}

      <Button type="submit" size="lg" className="w-full gap-2" disabled={status === 'sending'}>
        <Send className="w-4 h-4" aria-hidden />
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </Button>
      <p className="text-xs text-gray-500 leading-relaxed">
        We only use your email address to reply to this message. It isn&apos;t added to any mailing list or shared.
        See our <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </form>
  )
}
