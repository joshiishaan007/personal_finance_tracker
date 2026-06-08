'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

// Convert a URL-safe base64 VAPID public key to the Uint8Array the Push API needs.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const pad  = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64  = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw  = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [supported,   setSupported]   = useState(false);
  const [subscribed,  setSubscribed]  = useState(false);
  const [permission,  setPermission]  = useState<NotificationPermission>('default');
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    const ok = typeof window !== 'undefined'
      && 'Notification' in window
      && 'serviceWorker' in navigator
      && 'PushManager' in window;
    setSupported(ok);
    if (!ok) return;

    setPermission(Notification.permission);

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  async function subscribe() {
    if (!supported || loading) return;
    setLoading(true);

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') { setLoading(false); return; }

    const reg = await navigator.serviceWorker.ready;
    const resp = await api.get<{ data: { publicKey: string } }>(
      ENDPOINTS.push.vapidPublicKey,
    );
    const publicKey = resp.data.data.publicKey;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      // Cast needed: TS lib types expect ArrayBuffer but Uint8Array<ArrayBufferLike> works at runtime.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as ArrayBuffer,
    });

    await api.post(ENDPOINTS.push.subscribe, {
      endpoint:     sub.endpoint,
      subscription: JSON.stringify(sub),
    });

    setSubscribed(true);
    setLoading(false);
  }

  async function unsubscribe() {
    if (!supported || loading) return;
    setLoading(true);

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await api.post(ENDPOINTS.push.unsubscribe, { endpoint: sub.endpoint });
      await sub.unsubscribe();
    }

    setSubscribed(false);
    setLoading(false);
  }

  return { supported, subscribed, permission, loading, subscribe, unsubscribe };
}
