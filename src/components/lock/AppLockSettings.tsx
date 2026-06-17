'use client';

import { useState } from 'react';
import { ShieldCheck, Lock, Fingerprint } from 'lucide-react';
import { useAppLock } from '@/contexts/AppLockContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { IconBadge } from '@/components/ui/IconBadge';

type Mode = 'set' | 'change' | 'remove' | null;

const onlyDigits = (v: string) => v.replace(/\D/g, '');

export function AppLockSettings() {
  const {
    enabled, setPin, changePin, disable, lockNow,
    biometricSupported, biometricEnabled, enableBiometric, disableBiometric,
  } = useAppLock();
  const [mode, setMode] = useState<Mode>(null);
  const [bioError, setBioError] = useState<string | null>(null);

  async function toggleBiometric(on: boolean) {
    setBioError(null);
    if (!on) return disableBiometric();
    const ok = await enableBiometric();
    if (!ok) setBioError("Couldn't set up fingerprint unlock. Try again.");
  }
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    setMode(null);
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  }

  async function submit() {
    setError(null);
    if (mode !== 'remove') {
      if (next.length < 4) return setError('PIN must be at least 4 digits.');
      if (next !== confirm) return setError('PINs do not match.');
    }
    setBusy(true);
    let ok = true;
    if (mode === 'set') await setPin(next);
    else if (mode === 'change') ok = await changePin(current, next);
    else if (mode === 'remove') ok = await disable(current);
    setBusy(false);
    if (!ok) return setError('Current PIN is incorrect.');
    close();
  }

  const title = mode === 'set' ? 'Set up PIN' : mode === 'change' ? 'Change PIN' : 'Remove PIN';

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <IconBadge icon={ShieldCheck} tone="brand" />
        <Heading level={3}>App Lock</Heading>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <Text className="font-medium">{enabled ? 'PIN lock is on' : 'Lock with a PIN'}</Text>
          <Text variant="small">Stored only on this device — never sent anywhere</Text>
        </div>
        {enabled ? (
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="secondary" size="sm" leftIcon={<Lock size={14} strokeWidth={2.2} />} onClick={lockNow}>Lock now</Button>
            <Button variant="secondary" size="sm" onClick={() => setMode('change')}>Change</Button>
            <Button variant="ghost" size="sm" className="hover:text-danger-500" onClick={() => setMode('remove')}>Remove</Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" leftIcon={<ShieldCheck size={15} strokeWidth={2.2} />} onClick={() => setMode('set')} className="w-full sm:w-auto shrink-0">
            Set up PIN
          </Button>
        )}
      </div>

      {/* Fingerprint — only once a PIN exists (the required fallback) and the
          device has a platform authenticator. */}
      {enabled && biometricSupported && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-white/5 pt-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Fingerprint size={18} strokeWidth={2.2} className="shrink-0 text-brand-500" />
            <div className="min-w-0">
              <Text className="font-medium">Unlock with fingerprint</Text>
              <Text variant="small">Use your device biometrics; PIN still works as a backup</Text>
            </div>
          </div>
          <Switch checked={biometricEnabled} onChange={toggleBiometric} label="Unlock with fingerprint" className="shrink-0" />
        </div>
      )}
      {bioError && <Text variant="small" className="mt-2 text-danger-600 dark:text-danger-400">{bioError}</Text>}

      <Modal
        open={mode !== null}
        onClose={close}
        title={title}
        placement="center"
        footer={
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={close} className="flex-1">Cancel</Button>
            <Button type="button" variant={mode === 'remove' ? 'danger' : 'primary'} onClick={submit} loading={busy} className="flex-1">
              {mode === 'remove' ? 'Remove' : 'Save'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {(mode === 'change' || mode === 'remove') && (
            <Input
              label="Current PIN"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={current}
              onChange={(e) => setCurrent(onlyDigits(e.target.value))}
              placeholder="••••"
            />
          )}
          {mode !== 'remove' && (
            <>
              <Input
                label={mode === 'change' ? 'New PIN' : 'PIN (4–8 digits)'}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={next}
                onChange={(e) => setNext(onlyDigits(e.target.value).slice(0, 8))}
                placeholder="••••"
              />
              <Input
                label="Confirm PIN"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={confirm}
                onChange={(e) => setConfirm(onlyDigits(e.target.value).slice(0, 8))}
                placeholder="••••"
              />
            </>
          )}
          {error && <Text variant="small" className="text-danger-600 dark:text-danger-400">{error}</Text>}
        </div>
      </Modal>
    </Card>
  );
}
