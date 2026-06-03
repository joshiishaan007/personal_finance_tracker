'use client';

import { useEffect } from 'react';

// Registers the service worker in production only. In dev the app runs with
// `next dev --turbo` and no SW, which avoids the stale-cache class of bugs.
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  return null;
}
