'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { useDailyEngagement } from '@/hooks/useDailyEngagement';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';

const MILESTONES = [3, 7, 30, 100];

export function StreakBadge({ className }: { className?: string }) {
  const { data } = useDailyEngagement();
  const streak = data?.streak ?? 0;
  const [celebrate, setCelebrate] = useState(false);

  // Fire confetti once per milestone reached — guarded in localStorage so a refetch
  // or page revisit on the same milestone day doesn't re-trigger it.
  useEffect(() => {
    if (!MILESTONES.includes(streak)) return;
    const key = `streak-milestone-${streak}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setCelebrate(true);
    const t = setTimeout(() => setCelebrate(false), 2200);
    return () => clearTimeout(t);
  }, [streak]);

  const active = streak > 0;

  return (
    <>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
          active
            ? 'bg-warn-500/15 text-warn-600 dark:text-warn-400'
            : 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
          className,
        )}
      >
        <Flame size={15} strokeWidth={2.4} className={active ? 'text-warn-500' : 'text-slate-400'} />
        <Text as="span" className="text-xs font-semibold text-current">
          {active ? `${streak}-day streak` : 'Log today to start a streak'}
        </Text>
      </div>
      <ConfettiBurst trigger={celebrate} />
    </>
  );
}
