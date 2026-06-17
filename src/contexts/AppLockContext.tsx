'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Fully client-side app lock. A salted SHA-256 of the PIN is kept in
// localStorage — the raw PIN is never stored and nothing is sent to the server.
// This is a privacy curtain for a shared device, not server-grade auth.
const K_ENABLED = 'pft.lock.enabled';
const K_SALT = 'pft.lock.salt';
const K_HASH = 'pft.lock.hash';
const RELOCK_AFTER_MS = 2 * 60 * 1000; // re-lock if hidden longer than this

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return toHex(a.buffer);
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

interface AppLockValue {
  ready: boolean;
  enabled: boolean;
  locked: boolean;
  setPin: (pin: string) => Promise<void>;
  changePin: (current: string, next: string) => Promise<boolean>;
  disable: (current: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lockNow: () => void;
}

const AppLockContext = createContext<AppLockValue | null>(null);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    const on = localStorage.getItem(K_ENABLED) === '1' && !!localStorage.getItem(K_HASH);
    setEnabled(on);
    setLocked(on); // a fresh load of an enabled lock starts locked
    setReady(true);
  }, []);

  // Re-lock when the tab returns after being hidden a while.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_AFTER_MS) {
        if (localStorage.getItem(K_ENABLED) === '1') setLocked(true);
        hiddenAt.current = null;
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const verify = useCallback(async (pin: string) => {
    const salt = localStorage.getItem(K_SALT);
    const hash = localStorage.getItem(K_HASH);
    if (!salt || !hash) return false;
    return (await hashPin(pin, salt)) === hash;
  }, []);

  const setPin = useCallback(async (pin: string) => {
    const salt = randomSalt();
    localStorage.setItem(K_SALT, salt);
    localStorage.setItem(K_HASH, await hashPin(pin, salt));
    localStorage.setItem(K_ENABLED, '1');
    setEnabled(true);
    setLocked(false);
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const ok = await verify(pin);
    if (ok) setLocked(false);
    return ok;
  }, [verify]);

  const changePin = useCallback(async (current: string, next: string) => {
    if (!(await verify(current))) return false;
    await setPin(next);
    return true;
  }, [verify, setPin]);

  const disable = useCallback(async (current: string) => {
    if (!(await verify(current))) return false;
    localStorage.removeItem(K_ENABLED);
    localStorage.removeItem(K_SALT);
    localStorage.removeItem(K_HASH);
    setEnabled(false);
    setLocked(false);
    return true;
  }, [verify]);

  const lockNow = useCallback(() => {
    if (localStorage.getItem(K_ENABLED) === '1') setLocked(true);
  }, []);

  return (
    <AppLockContext.Provider value={{ ready, enabled, locked, setPin, changePin, disable, unlock, lockNow }}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock(): AppLockValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within AppLockProvider');
  return ctx;
}
