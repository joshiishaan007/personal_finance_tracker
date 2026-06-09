'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import { clearQueue } from '@/lib/offlineQueue';

interface UserData {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  timezone: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    mode: 'finance' | 'goals';
    compactMode: boolean;
    weekStartsOn: number;
  };
  createdAt: string;
}

interface AuthContextValue {
  user: UserData | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Versioned key — bump the suffix whenever UserData shape changes so stale
// cached objects are automatically discarded on the next visit.
const USER_CACHE_KEY = 'pft-user-v1';

function readCache(): UserData | null {
  try {
    const s = localStorage.getItem(USER_CACHE_KEY);
    return s ? (JSON.parse(s) as UserData) : null;
  } catch {
    return null;
  }
}

function writeCache(u: UserData | null) {
  try {
    // Redact email from the at-rest cache — it's only needed for first paint of
    // name/avatar/preferences; the real email arrives from /api/auth/me. Keeps
    // PII out of localStorage (an XSS-readable, shared-device-readable store).
    if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ ...u, email: '' }));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // Ignore: private-mode / storage-quota edge cases.
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  // Start loading until at least one server response (or cache restore) completes.
  const [isLoading, setIsLoading] = useState(true);

  function applyUser(u: UserData | null) {
    setUser(u);
    writeCache(u);
  }

  async function fetchUser() {
    try {
      const res = await api.get<{ data: UserData }>(ENDPOINTS.auth.me);
      applyUser(res.data.data ?? null);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        // Token expired / invalid — clear cache and force re-login.
        applyUser(null);
      }
      // 5xx / network error: keep existing state. A DB cold-start on Vercel
      // should not force re-login — the cookie is still valid. The session
      // will be re-verified on the next successful server call.
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } finally {
      applyUser(null);
      // Drop any plaintext financial data queued offline on this device.
      void clearQueue().catch(() => {});
      window.location.href = '/login';
    }
  }

  useEffect(() => {
    // Restore from localStorage immediately so returning users see the app
    // without a loading spinner while waiting for the server round-trip.
    const cached = readCache();
    if (cached) {
      setUser(cached);
      setIsLoading(false);
    }
    // Always re-verify with the server in the background. This updates the
    // cache if preferences/name changed and detects genuinely expired tokens.
    void fetchUser();
    // fetchUser is stable for this effect; deps intentionally empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
