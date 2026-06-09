/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

// Baseline CSP. script-src keeps 'unsafe-inline' (the pre-hydration theme IIFE in
// layout.tsx + Next's framework scripts) so a live deploy can't white-screen;
// the strong wins here are frame-ancestors (clickjacking), object-src, base-uri
// and form-action. Tightening script-src to a per-request nonce is a follow-up
// that must be verified in a browser first.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https://lh3.googleusercontent.com",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  // Mongoose pulls in optional native deps it never uses in serverless; keep them external.
  // Next 14.2: this lives under `experimental` (top-level `serverExternalPackages` is Next 15).
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'pino', 'pino-pretty'],
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
};

export default nextConfig;
