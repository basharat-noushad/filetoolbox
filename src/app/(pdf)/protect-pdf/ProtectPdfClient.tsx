'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDropzone } from '@/components/tools/FileDropzone'
import { ToolResult } from '@/components/tools/ToolResult'
import type { PdfPermissions } from '@/lib/tools/pdf/qpdf'

type Mode = 'open' | 'restrict'

const ALLOW_ALL: PdfPermissions = { print: 'full', copy: true, edit: true, annotate: true }
const RESTRICT_DEFAULT: PdfPermissions = { print: 'full', copy: false, edit: false, annotate: false }

// 20 chars from a 64-symbol alphabet = 120 bits. 64 divides 256, so `b & 63` has no modulo bias.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const generatePassword = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(20)), b => ALPHABET[b & 63]).join('')

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

export function ProtectPdfClient() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<Mode>('open')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [perms, setPerms] = useState<PdfPermissions>(ALLOW_ALL)
  const [generated, setGenerated] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Any input change invalidates a previous result.
  const touch = () => { setResult(null); setError(null) }
  const setPwd = (v: string) => { setPassword(v); setGenerated(null); touch() }
  const setConf = (v: string) => { setConfirm(v); setGenerated(null); touch() }
  const setPerm = <K extends keyof PdfPermissions>(k: K, v: PdfPermissions[K]) => { setPerms(p => ({ ...p, [k]: v })); touch() }

  const switchMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    setPerms(m === 'restrict' ? RESTRICT_DEFAULT : ALLOW_ALL)
    setPassword(''); setConfirm(''); setGenerated(null)
    touch()
  }

  const handleGenerate = () => {
    const pw = generatePassword()
    setPassword(pw); setConfirm(pw); setGenerated(pw); setCopied(false)
    touch()
  }

  const handleCopy = async () => {
    if (!generated) return
    try { await navigator.clipboard.writeText(generated); setCopied(true) } catch { setError('Could not copy. Please select the password and copy it manually.') }
  }

  const restricted = perms.print !== 'full' || !perms.copy || !perms.edit || !perms.annotate

  const handleProtect = async () => {
    if (processing) return
    if (files.length === 0) { setError('Please select a PDF file.'); return }
    if (!password) { setError(mode === 'open' ? 'Please enter a password.' : 'Please enter or generate a permissions password.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (mode === 'restrict' && !restricted) { setError('Choose at least one restriction, or use "Password to open" instead.'); return }
    setProcessing(true); setError(null); setResult(null)
    try {
      // qpdf (WebAssembly) is loaded only when the user clicks.
      const { protectPdf, QpdfError } = await import('@/lib/tools/pdf/qpdf')
      try {
        const blob = await protectPdf(files[0], mode === 'open'
          ? { userPassword: password, permissions: perms }
          : { userPassword: '', ownerPassword: password, permissions: perms })
        setResult(blob)
        // Don't keep passwords in memory once the file is made.
        setPassword(''); setConfirm(''); setGenerated(null)
      } catch (err) {
        if (err instanceof QpdfError) setError(err.message)
        else throw err
      }
    } catch {
      setError('Failed to protect PDF. Please check your file and try again.')
    } finally {
      setProcessing(false)
    }
  }

  const modeBtn = (m: Mode, title: string, sub: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={mode === m}
      onClick={() => switchMode(m)}
      className={`text-left rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
        mode === m ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-300 hover:border-brand-400'
      }`}
    >
      <span className="block text-sm font-medium text-gray-900">{title}</span>
      <span className="block text-xs text-gray-500 mt-0.5">{sub}</span>
    </button>
  )

  const check = (k: 'copy' | 'edit' | 'annotate', label: string) => (
    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input type="checkbox" checked={perms[k]} onChange={e => setPerm(k, e.target.checked)} className="w-4 h-4 accent-brand-600" />
      {label}
    </label>
  )

  const pwLabel = mode === 'open' ? 'Password to open' : 'Permissions password'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      <FileDropzone
        accept={{ 'application/pdf': ['.pdf'] }}
        onFilesSelected={f => { setFiles(f); touch() }}
        label="Drag & drop your PDF here"
      />

      <div role="radiogroup" aria-label="Protection type" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {modeBtn('open', 'Password to open', 'Encrypts the file. A password is needed to view it.')}
        {modeBtn('restrict', 'Restrict only', 'Opens without a password, but limits printing, copying or editing.')}
      </div>

      {/* data-clarity-mask: keep the generated password out of session-replay analytics. */}
      <div className="space-y-3" data-clarity-mask="true">
        <div>
          <div className="flex items-center justify-between mb-1 gap-2">
            <label htmlFor="pp-pw" className="block text-sm font-medium text-gray-700">{pwLabel}</label>
            {mode === 'restrict' && (
              <button type="button" onClick={handleGenerate} className="text-xs font-medium text-brand-700 hover:underline cursor-pointer">
                Generate strong password
              </button>
            )}
          </div>
          <input id="pp-pw" type="password" autoComplete="new-password" value={password} onChange={e => setPwd(e.target.value)}
            placeholder={mode === 'open' ? 'Enter password' : 'Asked for before restrictions can be changed'} className={inputCls} />
        </div>
        <div>
          <label htmlFor="pp-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input id="pp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={e => setConf(e.target.value)}
            placeholder="Confirm password" className={inputCls} />
        </div>
        {generated && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 space-y-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 break-all font-mono text-sm text-gray-900 select-all">{generated}</code>
              <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="shrink-0 cursor-pointer">
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-amber-800">
              Save this password now. It is shown only once and cleared when the PDF is created. Acrobat and similar editors ask for it before the restrictions can be changed.
            </p>
          </div>
        )}
      </div>

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-medium text-gray-700 mb-2">
          Permissions {mode === 'open' && <span className="font-normal text-gray-500">(optional)</span>}
        </legend>
        <label className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
          Printing
          <select value={perms.print} onChange={e => setPerm('print', e.target.value as PdfPermissions['print'])}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="full">Allowed</option>
            <option value="low">Low resolution only</option>
            <option value="none">Not allowed</option>
          </select>
        </label>
        {check('copy', 'Allow copying text and images')}
        {check('edit', 'Allow editing (content and pages)')}
        {check('annotate', 'Allow comments and form filling')}
      </fieldset>

      <p className="text-xs text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
        {mode === 'open'
          ? 'Your PDF is encrypted with AES-256 right here in your browser. The file and password never leave your device.'
          : 'Restrictions are applied in your browser and nothing is uploaded.'}{' '}
        Permission limits are respected by Adobe Acrobat, web browsers, macOS Preview and most readers, but some tools ignore them,
        so they are not strong protection against a determined user. Only a password to open truly locks the content.
      </p>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      <Button onClick={handleProtect} disabled={files.length === 0 || processing} className="w-full cursor-pointer" size="lg">
        {processing ? 'Protecting…' : 'Protect PDF'}
      </Button>
      {result && <ToolResult blob={result} filename="protected.pdf" label="PDF protected successfully!" />}
    </div>
  )
}
