'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { flushQueue } from '@/lib/offlineQueue';

// Replays the IndexedDB offline write-queue on reconnect (and on load, for writes
// left over from a previous offline session), then refreshes the caches so
// server-synced rows replace the optimistic echoes. Mounted once in Providers.
export function OfflineSync() {
  useEffect(() => {
    async function sync() {
      await flushQueue(async (endpoint, method, body) => {
        await api.request({ url: endpoint, method, data: body });
      });
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
      void queryClient.invalidateQueries({ queryKey: ['engagement'] });
    }

    if (navigator.onLine) void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);

  return null;
}
