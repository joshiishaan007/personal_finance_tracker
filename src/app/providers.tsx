'use client';

import dynamic from 'next/dynamic';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/lib/queryClient';
import { asyncPersister } from '@/lib/queryPersister';
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

// Only the queries that power the offline-viewable screens (dashboard, balance,
// goals home, recent transactions) are persisted — not every browsed report —
// so the snapshot stays small.
const PERSIST_KEYS = new Set([
  'analytics', 'balance', 'transactions', 'categories', 'user',
  'spendingPlan', 'investments', 'recurring',
  // Form options + transaction-page widgets so they work offline (instant cards
  // carry the category/icon/colour the add-form needs; debts feed the owe lists).
  'instantCards', 'debts',
  'goals', 'lifeGoals', 'goalsSummary', 'goalsToday', 'contributionHeatmap',
]);

const persistOptions = {
  persister: asyncPersister,
  maxAge: 1000 * 60 * 60 * 24 * 3, // keep the snapshot for 3 days
  buster: 'pft-cache-v1', // bump to invalidate every persisted cache on a breaking change
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Parameters<typeof defaultShouldDehydrateQuery>[0]) =>
      defaultShouldDehydrateQuery(query) && PERSIST_KEYS.has(String((query.queryKey as readonly unknown[])[0])),
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ThemeProvider>
        <AuthProvider>
          <ModeProvider>{children}</ModeProvider>
        </AuthProvider>
      </ThemeProvider>
      <OfflineSync />
      <ServiceWorkerRegistrar />
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  );
}
