'use client';

import { useAppLock } from '@/contexts/AppLockContext';
import { LockScreen } from '@/components/lock/LockScreen';

// Withholds the app behind the PIN screen. Until the lock state has hydrated we
// render nothing so protected content never flashes before the lock can appear.
export function LockGate({ children }: { children: React.ReactNode }) {
  const { ready, locked } = useAppLock();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-ink-950">
        <div className="w-12 h-12 rounded-full bg-aurora animate-spin [mask:radial-gradient(farthest-side,transparent_calc(100%-3px),#000_0)]" />
      </div>
    );
  }
  if (locked) return <LockScreen />;
  return <>{children}</>;
}
