'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAppLock } from '@/contexts/AppLockContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

export function LockScreen() {
  const { unlock } = useAppLock();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin || busy) return;
    setBusy(true);
    const ok = await unlock(pin);
    setBusy(false);
    if (!ok) {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-ink-950 p-4">
      <div className="w-full max-w-xs text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-aurora text-white shadow-card">
          <Lock size={26} strokeWidth={2.2} />
        </div>
        <Heading level={2} className="text-xl">App locked</Heading>
        <Text variant="small" className="mt-1 text-slate-500">Enter your PIN to continue</Text>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            autoFocus
            autoComplete="off"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(false); }}
            placeholder="••••"
            className="text-center tracking-[0.5em] text-lg"
            error={error ? 'Incorrect PIN' : undefined}
          />
          <Button type="submit" variant="gradient" className="w-full" loading={busy} disabled={pin.length < 4}>
            Unlock
          </Button>
        </form>
      </div>
    </div>
  );
}
