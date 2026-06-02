'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Globe, LayoutGrid, PartyPopper, ArrowRight, ArrowLeft,
  Utensils, Car, ShoppingBag, Clapperboard, Pill, Briefcase,
  type LucideIcon,
} from 'lucide-react';
import { useUpdatePreferences } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';
import { ISO4217Currencies } from '@/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { IconBadge } from '@/components/ui/IconBadge';
import { cn } from '@/lib/utils';

const TIMEZONES = ['Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'];

const STARTER_CATEGORIES: { name: string; icon: LucideIcon; type: 'expense' | 'income' }[] = [
  { name: 'Food & Dining', icon: Utensils, type: 'expense' },
  { name: 'Transport', icon: Car, type: 'expense' },
  { name: 'Shopping', icon: ShoppingBag, type: 'expense' },
  { name: 'Entertainment', icon: Clapperboard, type: 'expense' },
  { name: 'Health', icon: Pill, type: 'expense' },
  { name: 'Salary', icon: Briefcase, type: 'income' },
];

export function OnboardingView() {
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(STARTER_CATEGORIES.map((c) => c.name));
  const router = useRouter();
  const { refetchUser } = useAuth();

  const { register, handleSubmit } = useForm({
    defaultValues: { currency: 'INR', timezone: 'Asia/Kolkata' },
  });

  const savePrefs = useUpdatePreferences(refetchUser);

  function skip() {
    router.push('/dashboard');
  }

  async function onStep1(data: { currency: string; timezone: string }) {
    await savePrefs.mutateAsync({ timezone: data.timezone });
    setStep(2);
  }

  function onStep2() {
    setStep(3);
  }

  function onStep3() {
    router.push('/dashboard');
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-aurora bg-[length:200%_200%] animate-gradient-shift opacity-15 dark:opacity-25" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-glow-radial" aria-hidden />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Step progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                s === step ? 'w-10 bg-aurora bg-[length:200%_200%] animate-gradient-shift'
                  : s < step ? 'w-5 bg-brand-400'
                    : 'w-5 bg-slate-300 dark:bg-ink-700',
              )}
            />
          ))}
        </div>

        <Card variant="glass" padding="lg" className="shadow-card-lg">
          {step === 1 && (
            <form onSubmit={handleSubmit(onStep1)} className="space-y-5">
              <div className="text-center">
                <IconBadge icon={Globe} size="lg" gradient className="mx-auto mb-4" />
                <Heading level={2} className="text-xl">Set your preferences</Heading>
                <Text variant="muted" className="mt-1">Choose your currency and timezone</Text>
              </div>
              <Select
                label="Currency"
                {...register('currency')}
                options={ISO4217Currencies.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Timezone"
                {...register('timezone')}
                options={TIMEZONES.map((t) => ({ value: t, label: t }))}
              />
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={skip} className="flex-1">Skip</Button>
                <Button type="submit" variant="gradient" className="flex-1" loading={savePrefs.isPending} rightIcon={<ArrowRight size={16} strokeWidth={2.4} />}>Next</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <IconBadge icon={LayoutGrid} size="lg" gradient className="mx-auto mb-4" />
                <Heading level={2} className="text-xl">Pick starter categories</Heading>
                <Text variant="muted" className="mt-1">You can always add more later</Text>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {STARTER_CATEGORIES.map((cat) => {
                  const selected = selectedCategories.includes(cat.name);
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.name}
                      variant="ghost"
                      onClick={() => setSelectedCategories((prev) =>
                        selected ? prev.filter((c) => c !== cat.name) : [...prev, cat.name]
                      )}
                      className={cn(
                        'flex items-center gap-2.5 p-3 rounded-2xl border text-sm font-semibold justify-start min-h-[52px]',
                        selected
                          ? 'bg-brand-500/10 border-brand-400/60 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300',
                      )}
                    >
                      <Icon size={18} strokeWidth={2.2} className="shrink-0" />
                      <Text as="span" className="truncate">{cat.name}</Text>
                    </Button>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1" leftIcon={<ArrowLeft size={16} strokeWidth={2.4} />}>Back</Button>
                <Button variant="gradient" onClick={onStep2} className="flex-1" rightIcon={<ArrowRight size={16} strokeWidth={2.4} />}>Next</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div>
                <IconBadge icon={PartyPopper} size="lg" gradient className="mx-auto mb-4 animate-float" />
                <Heading level={2} className="text-xl">You&apos;re all set!</Heading>
                <Text variant="muted" className="mt-1">Add your first transaction to get started</Text>
              </div>
              <Button variant="gradient" onClick={onStep3} className="w-full" size="lg" rightIcon={<ArrowRight size={18} strokeWidth={2.4} />}>Go to Dashboard</Button>
            </div>
          )}
        </Card>

        <Button variant="ghost" onClick={skip} className="mt-4 w-full text-xs text-slate-500 dark:text-slate-400 min-h-0">
          Skip setup for now
        </Button>
      </div>
    </main>
  );
}
