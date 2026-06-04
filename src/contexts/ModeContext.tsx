'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdatePreferences } from '@/hooks/useUser';
import { modeForPath, MODE_HOME, MODE_STORAGE_KEY, type AppMode } from '@/lib/mode';

interface ModeContextValue {
  mode: AppMode; // active mode, derived from the URL
  switchMode: (target: AppMode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { refetchUser } = useAuth();
  const updatePrefs = useUpdatePreferences(refetchUser);

  const mode = modeForPath(pathname);

  // Keep the accent (data-mode on <html>) in sync on client navigation; the
  // inline no-flash script in layout.tsx handles the very first paint.
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  function switchMode(target: AppMode) {
    if (target === mode) return;
    try {
      localStorage.setItem(MODE_STORAGE_KEY, target);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
    updatePrefs.mutate({ mode: target }); // best-effort cross-device sync
    router.push(MODE_HOME[target]);
  }

  return <ModeContext.Provider value={{ mode, switchMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside ModeProvider');
  return ctx;
}
