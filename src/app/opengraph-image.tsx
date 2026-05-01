import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'FileToolBox — Free PDF & Image Tools Online'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 18, background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, fontWeight: 900, color: '#2563EB',
          }}>
            F
          </div>
          <span style={{ fontSize: 64, fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
            FileToolBox
          </span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 30, color: '#93c5fd', marginBottom: '48px', textAlign: 'center' }}>
          Free PDF &amp; Image Tools — No Sign-up Required
        </div>

        {/* Tool badges */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Merge PDF', 'Compress PDF', 'PDF to Word', 'Crop Image', 'Resize Image', 'Remove BG'].map(t => (
            <div
              key={t}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                padding: '10px 22px',
                color: 'white',
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '8px',
          background: 'linear-gradient(90deg, #EA580C, #F97316)',
        }} />
      </div>
    ),
    { ...size },
  )
}
