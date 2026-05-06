import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PDF and Image + — Free PDF & Image Tools Online'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1e1b4b',
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
            width: 76, height: 76, borderRadius: 18, background: '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, fontWeight: 900, color: 'white',
          }}>
            P+
          </div>
          <span style={{ fontSize: 58, fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
            PDF and Image +
          </span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 28, color: '#818cf8', marginBottom: '48px', textAlign: 'center' }}>
          Free PDF &amp; Image Tools — No Sign-up Required
        </div>

        {/* Tool badges */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Merge PDF', 'Compress PDF', 'PDF to Word', 'Crop Image', 'Resize Image', 'Remove BG'].map(t => (
            <div
              key={t}
              style={{
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.4)',
                borderRadius: '10px',
                padding: '10px 22px',
                color: '#c7d2fe',
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
          height: '6px',
          background: '#6366f1',
        }} />
      </div>
    ),
    { ...size },
  )
}
