import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Agency — Digital Marketing Excellence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #1e40af 0%, #047857 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
          padding: '40px',
        }}
      >
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            marginBottom: '20px',
            lineHeight: 1.2,
          }}
        >
          Agency
        </div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'normal',
            opacity: 0.9,
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Digital Marketing Excellence
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 'normal',
            opacity: 0.8,
            marginTop: '40px',
            borderTop: '2px solid rgba(255,255,255,0.3)',
            paddingTop: '20px',
          }}
        >
          Strategy, design, and growth that scale
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
