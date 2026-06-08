'use client';

import { useMemo } from 'react';
import { Flame, Trophy, Zap, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { Contribution } from '@/hooks/useContributions';
import type { LifeGoal } from '@/hooks/useLifeGoals';

interface Stats {
  currentStreak: number;
  bestStreak: number;
  total: number;
  daysActive: number;
}

function computeStats(contributions: Contribution[]): Stats {
  if (!contributions.length) return { currentStreak: 0, bestStreak: 0, total: 0, daysActive: 0 };

  const daySet = new Set<string>();
  let total = 0;
  for (const c of contributions) {
    daySet.add(c.date.split('T')[0]!);
    total += c.value;
  }

  const sorted = Array.from(daySet).sort(); // asc
  const daysActive = sorted.length;

  // Best streak: longest consecutive-day run
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff =
      (new Date(sorted[i]!).getTime() - new Date(sorted[i - 1]!).getTime()) / 86_400_000;
    run = diff === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  if (!sorted.length) best = 0;

  // Current streak: count backward from today (1-day grace if today has no log)
  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  let graceUsed = false;

  for (let i = 0; i < 366; i++) {
    const ds = cursor.toISOString().split('T')[0]!;
    if (daySet.has(ds)) {
      current++;
      graceUsed = true;
    } else if (!graceUsed) {
      graceUsed = true; // allow missing today or yesterday
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return { currentStreak: current, bestStreak: best, total, daysActive };
}

export function GoalStatsRow({ contributions, goal }: { contributions: Contribution[]; goal: LifeGoal }) {
  const s = useMemo(() => computeStats(contributions), [contributions]);

  const totalDisplay = goal.unit ? `${s.total} ${goal.unit}` : String(s.total);

  const items = [
    {
      icon: <Flame size={16} strokeWidth={2.2} className={s.currentStreak > 0 ? 'text-warn-500' : 'text-slate-400'} />,
      value: s.currentStreak,
      label: 'day streak',
    },
    {
      icon: <Trophy size={16} strokeWidth={2.2} className="text-brand-500" />,
      value: s.bestStreak,
      label: 'best streak',
    },
    {
      icon: <Zap size={16} strokeWidth={2.2} className="text-success-500" />,
      value: totalDisplay,
      label: 'total logged',
    },
    {
      icon: <CalendarDays size={16} strokeWidth={2.2} className="text-slate-400" />,
      value: s.daysActive,
      label: 'days active',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {items.map(({ icon, value, label }) => (
        <Card key={label} padding="sm" className="flex items-center gap-2.5">
          <div className="shrink-0">{icon}</div>
          <div className="min-w-0">
            <Text className="text-base font-bold tabular-nums leading-tight truncate">{value}</Text>
            <Text variant="small" className="leading-tight">{label}</Text>
          </div>
        </Card>
      ))}
    </div>
  );
}
