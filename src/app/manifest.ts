import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Personal Finance Tracker',
    short_name: 'Finance',
    description: 'Your lifetime personal finance companion',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0B0B14',
    theme_color: '#0B0B14',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
