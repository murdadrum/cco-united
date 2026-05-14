import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CCO United — One Platform. Fourteen Communities. Stronger Together.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0e0b07',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(200,150,12,0.12) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* 7-pointed star SVG */}
        <svg
          width="220"
          height="220"
          viewBox="0 0 32 32"
          style={{ marginBottom: 32 }}
        >
          <rect width="32" height="32" rx="4" fill="#1A0F0A" />
          <path d="M16.0,16.0 L13.27,10.32 L16.00,2.00 L18.73,10.32 Z" fill="#8B1A1A" stroke="#C8960C" strokeWidth="0.6" />
          <path d="M16.0,16.0 L18.73,10.32 L26.95,7.27 L22.14,14.60 Z" fill="#C8960C" stroke="#C8960C" strokeWidth="0.6" />
          <path d="M16.0,16.0 L22.14,14.60 L29.65,19.12 L20.93,19.93 Z" fill="#4A5E3A" stroke="#C8960C" strokeWidth="0.6" />
          <path d="M16.0,16.0 L20.93,19.93 L22.07,28.61 L16.00,22.30 Z" fill="#2C5F7A" stroke="#C8960C" strokeWidth="0.6" />
          <path d="M16.0,16.0 L16.00,22.30 L9.93,28.61 L11.07,19.93 Z" fill="#7A3B6B" stroke="#C8960C" strokeWidth="0.6" />
          <path d="M16.0,16.0 L11.07,19.93 L2.35,19.12 L9.86,14.60 Z" fill="#8B5E1A" stroke="#C8960C" strokeWidth="0.6" />
          <path d="M16.0,16.0 L9.86,14.60 L5.05,7.27 L13.27,10.32 Z" fill="#1A4A3A" stroke="#C8960C" strokeWidth="0.6" />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: '#C8960C',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          CCO UNITED
        </div>

        {/* Divider */}
        <div
          style={{
            width: 120,
            height: 1,
            background: 'rgba(200,150,12,0.5)',
            marginBottom: 20,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: 'rgba(212,184,150,0.8)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          ONE PLATFORM · FOURTEEN COMMUNITIES
        </div>
      </div>
    ),
    { ...size }
  )
}
