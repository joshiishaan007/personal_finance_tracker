'use client';

import { Moon, Sunset, Laugh, Smile, Meh, Frown, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyEngagement } from '@/hooks/useDailyEngagement';
import { useDailyMood } from '@/hooks/useDailyMood';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { fmt, cn } from '@/lib/utils';

const MOODS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: 'great', icon: Laugh, label: 'Great' },
  { key: 'good', icon: Smile, label: 'Good' },
  { key: 'ok', icon: Meh, label: 'Okay' },
  { key: 'rough', icon: Frown, label: 'Rough' },
];

export function EndOfDayCard() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { data } = useDailyEngagement();
  const { mood, setMood } = useDailyMood();

  const todayCount = data?.todayCount ?? 0;
  const todaySpent = data?.todaySpent ?? 0;
  const avg = data?.avgDailySpend ?? 0;

  const evening = new Date().getHours() >= 17;
  const diff = avg - todaySpent;
  const underAvg = diff >= 0;

  return (
    <Card variant="glass">
      <div className="flex items-start gap-3">
        <IconBadge icon={evening ? Moon : Sunset} tone="brand" size="lg" />
        <div className="min-w-0 flex-1">
          <Heading level={4}>{evening ? "How'd today go?" : 'Today so far'}</Heading>

          {todayCount === 0 ? (
            <Text variant="small" className="mt-1">
              Nothing logged yet — add today&apos;s spending to keep your streak alive.
            </Text>
          ) : (
            <Text variant="small" className="mt-1">
              You logged <Text as="span" className="font-semibold text-slate-700 dark:text-slate-200">{todayCount}</Text>
              {todayCount === 1 ? ' transaction' : ' transactions'} · spent{' '}
              <Text as="span" className="font-semibold text-slate-700 dark:text-slate-200">{fmt(todaySpent, currency)}</Text>
              {avg > 0 && (
                <>
                  {' · '}
                  <Text as="span" className={cn('font-semibold', underAvg ? 'text-success-600 dark:text-success-400' : 'text-warn-600 dark:text-warn-400')}>
                    {fmt(Math.abs(diff), currency)} {underAvg ? 'under' : 'over'}
                  </Text>{' '}
                  your daily average
                </>
              )}
            </Text>
          )}

          <div className="mt-3 flex items-center gap-2">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const active = mood === m.key;
              return (
                <Button
                  key={m.key}
                  variant="ghost"
                  size="sm"
                  onClick={() => setMood(m.key)}
                  aria-label={m.label}
                  aria-pressed={active}
                  className={cn('px-2', active && 'bg-brand-500/15 text-brand-600 dark:text-brand-300')}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
