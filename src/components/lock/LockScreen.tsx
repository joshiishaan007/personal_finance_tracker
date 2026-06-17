'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, Fingerprint } from 'lucide-react';
import { useAppLock } from '@/contexts/AppLockContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

export function LockScreen() {
  const { unlock, biometricSupported, biometricEnabled, unlockWithBiometric } = useAppLock();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const showBiometric = biometricSupported && biometricEnabled;

  // Auto-prompt the biometric sheet once when the lock appears (best-effort — some
  // browsers require a tap, so the button below is always available as a fallback).
  const prompted = useRef(false);
  useEffect(() => {
    if (showBiometric && !prompted.current) {
      prompted.current = true;
      void unlockWithBiometric();
    }
  }, [showBiometric, unlockWithBiometric]);

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
        <Text variant="small" className="mt-1 text-slate-500">
          {showBiometric ? 'Use your fingerprint or enter your PIN' : 'Enter your PIN to continue'}
        </Text>

        {showBiometric && (
          <Button
            type="button"
            variant="secondary"
            className="mt-5 w-full"
            leftIcon={<Fingerprint size={18} strokeWidth={2.2} />}
            onClick={() => void unlockWithBiometric()}
          >
            Unlock with fingerprint
          </Button>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
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
