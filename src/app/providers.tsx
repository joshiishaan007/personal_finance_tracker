'use client';

import dynamic from 'next/dynamic';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ModeProvider } from '@/contexts/ModeContext';
import { OfflineSync } from '@/components/OfflineSync';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

// Dev-only: the ternary is statically false in production, so minification drops
// the import() and the devtools never reach the production bundle.
const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools), { ssr: false })
    : () => null;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ModeProvider>{children}</ModeProvider>
        </AuthProvider>
      </ThemeProvider>
      <OfflineSync />
      <ServiceWorkerRegistrar />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
