// Hand-rolled service worker (no next-pwa) for full control over cache-busting —
// a prior workbox SW caused stale-asset bugs. Bump CACHE on each deploy to evict.
const CACHE = 'pft-v2';
const SHELL = ['/offline'];

// Normalised key for an RSC payload — strip the per-request `_rsc` hash and any
// page query (e.g. ?new=1) so a Link prefetch made while online matches the
// in-app navigation request made offline for the same route.
function rscKey(url) {
  return `${url.origin}${url.pathname}?__rsc`;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // third-party (avatars, etc.)
  if (url.pathname.startsWith('/api/')) return; // never cache API; offline queue handles writes

  // App Router client navigation fetches an RSC payload (RSC header / ?_rsc=), NOT
  // a navigate-mode request. Network-first, cached under a normalised key so a
  // prefetched route resolves offline — without this, in-app links (incl. the +
  // FAB) silently fail to navigate offline.
  const isRSC = request.headers.has('RSC') || url.searchParams.has('_rsc');
  if (isRSC) {
    const key = rscKey(url);
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(key, copy));
          return res;
        })
        .catch(() => caches.match(key)),
    );
    return;
  }

  // Navigations: network-first so a deploy is picked up immediately; fall back to
  // the cached page (ignoring query so ?new=1 etc. still match), then the offline shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request, { ignoreSearch: true })
            .then((cached) => cached || caches.match('/offline')),
        ),
    );
    return;
  }

  // Static, content-hashed assets + generated icons: cache-first.
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icon') ||
    url.pathname.startsWith('/apple-icon') ||
    /\.(?:js|css|woff2?|png|svg|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
  }
});

// ── Push notifications ─────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch (_) { return; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Budget Alert', {
      body: data.body || '',
      icon: data.icon || '/icon',
      tag:  data.tag  || 'budget-alert',
      data: { url: data.url || '/budgets' },
      requireInteraction: false,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/budgets';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing window if one is already open.
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
