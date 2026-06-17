'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLockProvider } from '@/contexts/AppLockContext';
import { LockGate } from '@/components/lock/LockGate';
import { AppShell } from '@/components/layout/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-ink-950">
        <div className="w-12 h-12 rounded-full bg-aurora animate-spin [mask:radial-gradient(farthest-side,transparent_calc(100%-3px),#000_0)]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLockProvider>
      <LockGate>
        <AppShell>{children}</AppShell>
      </LockGate>
    </AppLockProvider>
  );
}
