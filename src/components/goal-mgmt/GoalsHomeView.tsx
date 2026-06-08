'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Flame, Target, ListChecks, CircleAlert, Trophy } from 'lucide-react';
import { useLifeGoals, useGoalsSummary, lifeGoalProgress, type LifeGoal } from '@/hooks/useLifeGoals';
import { useContributionHeatmap } from '@/hooks/useContributions';
import { LifeGoalForm } from '@/components/goal-mgmt/LifeGoalForm';
import { ActivityHeatmap } from '@/components/goal-mgmt/ActivityHeatmap';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Link } from '@/components/ui/Link';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ProgressRing';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';

const STATUS_VARIANT: Record<string, 'success' | 'warn' | 'brand' | 'default'> = {
  achieved: 'success',
  paused: 'warn',
  active: 'brand',
  archived: 'default',
};

// Stable 1-year date range — computed once so the query key never changes on re-render
function useHeatmapRange() {
  return useMemo(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date(to);
    from.setFullYear(from.getFullYear() - 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);
}

export function GoalsHomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: goals, isLoading } = useLifeGoals();
  const { data: summary } = useGoalsSummary();

  const { from, to } = useHeatmapRange();
  const { data: heatmap } = useContributionHeatmap(from, to);

  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormOpen(true);
      router.replace('/goals');
    }
  }, [searchParams, router]);

  const visible = (goals ?? []).filter((g) => g.status !== 'archived');
  const achieved = (goals ?? []).filter((g) => g.status === 'achieved');

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading level={1} className="text-2xl">Goals</Heading>
          <Text variant="small" className="mt-0.5 text-slate-500">Everything you&apos;re working toward</Text>
        </div>
        <Button size="sm" variant="gradient" leftIcon={<Plus size={15} strokeWidth={2.4} />} onClick={() => setFormOpen(true)}>
          New goal
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card padding="md" className="flex items-center gap-3">
          <Flame size={22} strokeWidth={2.2} className={summary?.streak ? 'text-warn-500' : 'text-slate-300 dark:text-slate-600'} />
          <div>
            <Text className="text-xl font-bold tabular-nums leading-tight">{summary?.streak ?? 0}</Text>
            <Text variant="small">day streak</Text>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-3">
          <Target size={22} strokeWidth={2.2} className="text-brand-500" />
          <div>
            <Text className="text-xl font-bold tabular-nums leading-tight">{summary?.activeGoals ?? 0}</Text>
            <Text variant="small">active goals</Text>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-3">
          <ProgressRing pct={summary?.overallProgress ?? 0} size={40} strokeWidth={5} />
          <div>
            <Text className="text-xl font-bold tabular-nums leading-tight">{summary?.overallProgress ?? 0}%</Text>
            <Text variant="small">overall progress</Text>
          </div>
        </Card>

        <Link href="/goals/tasks" className="no-underline hover:no-underline">
          <Card padding="md" interactive className="flex items-center gap-3 h-full">
            {summary?.tasksOverdue ? (
              <CircleAlert size={22} strokeWidth={2.2} className="text-danger-500" />
            ) : (
              <ListChecks size={22} strokeWidth={2.2} className="text-brand-500" />
            )}
            <div>
              <Text className="text-xl font-bold tabular-nums leading-tight">{summary?.tasksOpen ?? 0}</Text>
              <Text variant="small">
                open tasks{summary?.tasksOverdue ? ` · ${summary.tasksOverdue} overdue` : ''}
              </Text>
            </div>
          </Card>
        </Link>
      </div>

      {/* Activity heatmap */}
      {heatmap && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <Heading level={5}>Activity — last 12 months</Heading>
            {heatmap.days.length > 0 && (
              <Text variant="small" className="text-slate-400">
                {heatmap.days.length} active day{heatmap.days.length !== 1 ? 's' : ''}
              </Text>
            )}
          </div>
          {heatmap.days.length === 0 ? (
            <Text variant="small" className="text-slate-400">
              Log progress on any goal to see your activity here.
            </Text>
          ) : (
            <ActivityHeatmap days={heatmap.days} peak={heatmap.peak} />
          )}
        </Card>
      )}

      {/* Active goals grid */}
      {isLoading ? (
        <SkeletonLoader rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Add something you want to achieve — big or small."
          action={{ label: 'Add your first goal', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div>
          <Heading level={5} className="mb-3">Active goals</Heading>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((g) => <GoalCard key={g._id} goal={g} />)}
          </div>
        </div>
      )}

      {/* Achieved goals */}
      {achieved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} strokeWidth={2.2} className="text-success-500" />
            <Heading level={5}>Achieved</Heading>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achieved.map((g) => <GoalCard key={g._id} goal={g} />)}
          </div>
        </div>
      )}

      <LifeGoalForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function GoalCard({ goal }: { goal: LifeGoal }) {
  const pct = lifeGoalProgress(goal);
  const statusVariant = STATUS_VARIANT[goal.status] ?? 'default';

  return (
    <Link href={`/goals/${goal._id}`} className="no-underline hover:no-underline">
      <Card interactive className="flex h-full items-center gap-3.5 p-4">
        <div className="shrink-0">
          <ProgressRing pct={pct} size={52} color={goal.color} strokeWidth={5} />
        </div>
        <div className="min-w-0 flex-1">
          <Text className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50 leading-snug">
            {goal.icon} {goal.title}
          </Text>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant={statusVariant} className="text-[10px] px-1.5 py-0.5">
              {goal.area}
            </Badge>
            {goal.targetValue ? (
              <Text as="span" variant="small" className="tabular-nums text-slate-500">
                {goal.currentValue}/{goal.targetValue} {goal.unit ?? ''}
              </Text>
            ) : pct > 0 ? (
              <Text as="span" variant="small" className="tabular-nums text-slate-500">
                {pct}%
              </Text>
            ) : null}
          </div>
          {/* Thin progress bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-slate-100 dark:bg-ink-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: goal.color }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
