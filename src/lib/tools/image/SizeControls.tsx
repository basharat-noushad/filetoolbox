'use client'
import { UNITS, type Unit } from './dpi'
import { ID_PRESETS, type IdPreset } from './passportPresets'

const DPIS = [72, 96, 150, 300]
const field = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

export function SizeControls({ unit, dpi, onUnit, onDpi, onPreset }: {
  unit: Unit; dpi: string; onUnit: (u: Unit) => void; onDpi: (d: string) => void; onPreset: (p: IdPreset) => void
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label htmlFor="size-unit" className="block text-xs text-gray-600 mb-1">Unit</label>
          <select id="size-unit" value={unit} onChange={e => onUnit(e.target.value as Unit)} className={`${field} w-24 bg-white`}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {unit !== 'px' && (
          <div className="min-w-0">
            <label htmlFor="size-dpi" className="block text-xs text-gray-600 mb-1">DPI</label>
            <div className="flex flex-wrap items-center gap-2">
              <input id="size-dpi" type="number" min={1} max={1200} value={dpi} onChange={e => onDpi(e.target.value)} className={`${field} w-24`} />
              {DPIS.map(d => (
                <button key={d} type="button" onClick={() => onDpi(String(d))}
                  className={`px-2.5 py-2 border rounded-lg text-xs font-medium cursor-pointer ${String(d) === dpi ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-brand-400'}`}>{d}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-700 mb-2">Passport and ID photo sizes (300 DPI)</p>
      <div className="flex flex-wrap gap-2">
        {ID_PRESETS.map(p => (
          <button key={p.label} type="button" onClick={() => onPreset(p)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-brand-400 hover:text-brand-600 transition-all cursor-pointer text-left">{p.label}</button>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">Check your country&apos;s current rules (head size, background, print size) before submitting.</p>
    </div>
  )
}
