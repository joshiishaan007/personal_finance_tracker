import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #334155 0%, #2563EB 60%, #0EA5E9 100%)',
          color: 'white',
          fontSize: 74,
          fontWeight: 700,
          letterSpacing: -3,
        }}
      >
        PF
      </div>
    ),
    { ...size },
  );
}
