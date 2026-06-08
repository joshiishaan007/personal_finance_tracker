import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'xpensr',
    short_name: 'xpensr',
    description: 'Your lifetime personal finance companion',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0B0B14',
    theme_color: '#2563EB',
    categories: ['finance', 'productivity'],
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Add transaction',
        short_name: 'Add',
        url: '/transactions?new=1',
        description: 'Log a new income or expense',
      },
    ],
  };
}
