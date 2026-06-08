import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #14213D 0%, #090E1C 100%)',
          borderRadius: '22%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)',
        }} />
        <svg width="70%" height="70%" viewBox="0 0 100 100" style={{ position: 'relative' }}>
          <path d="M 82 33.5 A 37 37 0 1 0 68.5 20" fill="none" stroke="#F0C040" strokeWidth="4.5" strokeLinecap="round" />
          <rect x="24" y="62" width="8" height="12" rx="2" fill="#F0C040" />
          <rect x="36" y="55" width="8" height="19" rx="2" fill="#F0C040" />
          <rect x="48" y="47" width="8" height="27" rx="2" fill="#F0C040" />
          <rect x="60" y="38" width="8" height="36" rx="2" fill="#F0C040" />
          <line x1="66" y1="42" x2="76" y2="28" stroke="#F0C040" strokeWidth="5" strokeLinecap="round" />
          <path d="M 79 22 L 77 31 L 71 25 Z" fill="#F0C040" />
        </svg>
        <div style={{
          position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
          borderRadius: '20%',
          border: '3px solid rgba(224,148,16,0.22)',
        }} />
      </div>
    ),
    { ...size },
  );
}
