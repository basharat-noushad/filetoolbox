// qpdf 12 compiled to WebAssembly (@neslinesli93/qpdf-wasm). Runs entirely in the browser:
// files and passwords never leave the device. The .wasm is copied to public/qpdf/ by postinstall.

interface QpdfInstance {
  callMain: (args: string[]) => number
  FS: {
    writeFile: (path: string, data: Uint8Array) => void
    readFile: (path: string) => Uint8Array
    unlink: (path: string) => void
  }
}

type Run = (args: string[]) => { ok: boolean; stderr: string[] }

const IN = '/in.pdf'
const OUT = '/out.pdf'

export class QpdfError extends Error {}

type CreateModule = (opts: { locateFile: () => string }) => Promise<unknown>

// The emscripten glue has a `require("fs")` branch Turbopack can't resolve for the browser, so it is
// served from public/qpdf/ (postinstall copy) and loaded as a classic script, which defines the
// global factory `Module`. Loaded once, on first use.
let factory: Promise<CreateModule> | null = null
function loadFactory(): Promise<CreateModule> {
  factory ??= new Promise<CreateModule>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = new URL('/qpdf/qpdf.js', location.origin).href
    s.onload = () => {
      const g = globalThis as { Module?: CreateModule }
      if (typeof g.Module === 'function') resolve(g.Module)
      else reject(new Error('qpdf failed to load'))
    }
    s.onerror = () => reject(new Error('qpdf failed to load'))
    document.head.appendChild(s)
  }).catch(err => { factory = null; throw err })
  return factory
}

// A fresh instance per operation, so nothing (including password bytes in wasm memory) outlives it.
// The browser HTTP cache keeps the .wasm download to once per visit.
async function withQpdf(input: File, fn: (run: Run) => void): Promise<Uint8Array | null> {
  const createModule = await loadFactory()
  // This build has no print hooks: it binds console.log/console.error as stdout/stderr when the
  // factory is called. Swap them for a private sink only for that synchronous call, so qpdf output
  // is captured for error classification and never reaches the console.
  const sink: string[] = []
  const { log, error } = console
  let pending: Promise<unknown>
  console.log = console.error = (...a: unknown[]) => { sink.push(a.join(' ')) }
  try {
    // Absolute URL: relative paths break when code runs from a blob: URL under Turbopack.
    pending = createModule({ locateFile: () => new URL('/qpdf/qpdf.wasm', location.origin).href })
  } finally {
    console.log = log
    console.error = error
  }
  const qpdf = (await pending) as QpdfInstance
  try {
    qpdf.FS.writeFile(IN, new Uint8Array(await input.arrayBuffer()))
    fn(args => {
      sink.length = 0
      const code = qpdf.callMain(args)
      // qpdf exit codes: 0 ok, 2 error, 3 ok with warnings.
      return { ok: code === 0 || code === 3, stderr: [...sink] }
    })
    try { return qpdf.FS.readFile(OUT).slice() } catch { return null }
  } finally {
    for (const p of [IN, OUT]) { try { qpdf.FS.unlink(p) } catch { /* never created */ } }
  }
}

const isWrongPassword = (stderr: string[]) => stderr.some(l => /invalid password/i.test(l))
const hasErrors = (stderr: string[]) => stderr.some(l => !l.startsWith('WARNING'))
const toPdf = (bytes: Uint8Array) => new Blob([bytes as BlobPart], { type: 'application/pdf' })
const CORRUPT = 'Could not read this PDF. It may be damaged or not a valid PDF file.'

function randomPassword(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')
}

export interface PdfPermissions {
  print: 'full' | 'low' | 'none'
  copy: boolean      // extract text and images
  edit: boolean      // modify content + assemble (insert, delete, rotate pages)
  annotate: boolean  // comments and form filling
}

export const ALL_PERMISSIONS: PdfPermissions = { print: 'full', copy: true, edit: true, annotate: true }

// qpdf 12 256-bit flags, set one by one (not --modify=, whose levels bundle bits together).
function permissionArgs(p: PdfPermissions): string[] {
  const yn = (b: boolean) => (b ? 'y' : 'n')
  return [
    `--print=${p.print}`,
    `--extract=${yn(p.copy)}`,
    `--modify-other=${yn(p.edit)}`,
    `--assemble=${yn(p.edit)}`,
    `--annotate=${yn(p.annotate)}`,
    `--form=${yn(p.annotate)}`,
  ]
}

// Emscripten passes argv as C strings, so a NUL would silently truncate the password.
const BAD_CHARS = /[\u0000-\u001f\u007f]/

export interface ProtectOptions {
  userPassword: string       // '' = opens without a password (restrictions only)
  ownerPassword?: string     // omitted = random, never shown (fine when a user password is set)
  permissions?: PdfPermissions
}

export async function protectPdf(file: File, opts: ProtectOptions): Promise<Blob> {
  const { userPassword } = opts
  const ownerPassword = opts.ownerPassword || randomPassword()
  // qpdf 12 itself accepts an empty owner password with an empty user password, which would let
  // anyone strip the restrictions. Enforce the rules here, not only in the UI.
  if (!userPassword && !opts.ownerPassword) throw new QpdfError('A permissions password is required.')
  if (ownerPassword === userPassword) throw new QpdfError('The permissions password must be different from the open password.')
  if (BAD_CHARS.test(userPassword) || BAD_CHARS.test(ownerPassword)) throw new QpdfError('Passwords cannot contain control characters.')
  let failure = ''
  const out = await withQpdf(file, run => {
    // --*-password=value options, never positional args: qpdf takes everything after the first "="
    // literally, so a password starting with "-" or "@" or containing spaces/quotes is never parsed
    // as an option or argument file. argv is an array, so there is no shell splitting either.
    const r = run([IN, '--encrypt', `--user-password=${userPassword}`, `--owner-password=${ownerPassword}`, '--bits=256',
      ...permissionArgs(opts.permissions ?? ALL_PERMISSIONS), '--', OUT])
    if (!r.ok) failure = isWrongPassword(r.stderr) ? 'This PDF is already password-protected. Unlock it first, then protect it again.' : CORRUPT
  })
  if (failure || !out) throw new QpdfError(failure || CORRUPT)
  return toPdf(out)
}

export async function unlockPdf(file: File, password: string): Promise<Blob> {
  let failure = ''
  const out = await withQpdf(file, run => {
    // --is-encrypted with the password: ok = encrypted and password accepted.
    const check = run(['--is-encrypted', `--password=${password}`, IN])
    if (!check.ok) {
      failure = isWrongPassword(check.stderr)
        ? (password ? 'Incorrect password. Passwords are case-sensitive, so please try again.' : 'This PDF needs a password to open. Enter it above.')
        : hasErrors(check.stderr) ? CORRUPT
        : 'This PDF is not password-protected, so there is nothing to unlock.'
      return
    }
    if (!run(['--decrypt', `--password=${password}`, IN, OUT]).ok) failure = CORRUPT
  })
  if (failure || !out) throw new QpdfError(failure || CORRUPT)
  return toPdf(out)
}
