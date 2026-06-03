import { ImageResponse } from 'next/og';

// Edge runtime: the documented path for ImageResponse — avoids the Node-runtime
// "Invalid URL" font fetch failing during `next build` static generation.
export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

// Generated at build (next/og) — no binary asset to manage. Steel-blue monogram.
export default function Icon() {
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
          fontSize: 210,
          fontWeight: 700,
          letterSpacing: -8,
        }}
      >
        PF
      </div>
    ),
    { ...size },
  );
}
