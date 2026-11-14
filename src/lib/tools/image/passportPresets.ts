import type { Unit } from './dpi'
export interface IdPreset { label: string; w: number; h: number; unit: Unit }
// Common sizes, used at 300 DPI. Rules (head size, background) vary and change: always check the issuing authority.
export const ID_PRESETS: IdPreset[] = [
  { label: 'US 2×2 in', w: 2, h: 2, unit: 'in' },
  { label: 'UK / EU / India / Pakistan 35×45 mm', w: 35, h: 45, unit: 'mm' },
  { label: 'Schengen visa 35×45 mm', w: 35, h: 45, unit: 'mm' },
  { label: 'Canada 50×70 mm', w: 50, h: 70, unit: 'mm' },
  { label: 'China 33×48 mm', w: 33, h: 48, unit: 'mm' },
]
