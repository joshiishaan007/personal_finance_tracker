/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // Mongoose pulls in optional native deps it never uses in serverless; keep them external.
  // Next 14.2: this lives under `experimental` (top-level `serverExternalPackages` is Next 15).
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'pino', 'pino-pretty'],
  },
};

export default nextConfig;
