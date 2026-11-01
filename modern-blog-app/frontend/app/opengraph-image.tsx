import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Raju Tech - weekly AI-curated intelligence for cloud, DevOps and security';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #050811 0%, #0b1a33 55%, #1b1646 100%)',
          color: '#e8eef8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #67e8f9, #6366f1)',
              color: '#050811',
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            RJ
          </div>
          <div style={{ marginLeft: 24, fontSize: 40, fontWeight: 600 }}>Raju Tech</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
          Weekly AI-curated intelligence for cloud, DevOps and security
        </div>
        <div style={{ marginTop: 32, fontSize: 30, color: '#a6b2c7' }}>
          AI-assisted weekly reports on hundreds of enterprise tools
        </div>
      </div>
    ),
    { ...size }
  );
}
