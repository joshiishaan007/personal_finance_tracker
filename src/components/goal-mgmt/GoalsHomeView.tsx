'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Flame, Target, ListChecks, CircleAlert } from 'lucide-react';
import { useLifeGoals, useGoalsSummary, lifeGoalProgress, type LifeGoal } from '@/hooks/useLifeGoals';
import { LifeGoalForm } from '@/components/goal-mgmt/LifeGoalForm';
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

export function GoalsHomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: goals, isLoading } = useLifeGoals();
  const { data: summary } = useGoalsSummary();

  const [formOpen, setFormOpen] = useState(false);

  // The shell FAB links here with ?new=1 — open the create form, then clean the URL.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormOpen(true);
      router.replace('/goals');
    }
  }, [searchParams, router]);

  const visible = (goals ?? []).filter((g) => g.status !== 'archived');

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading level={1} className="text-2xl">Goals</Heading>
          <Text variant="small" className="mt-0.5">Everything you&apos;re working toward</Text>
        </div>
        <Button size="sm" variant="gradient" leftIcon={<Plus size={16} strokeWidth={2.4} />} onClick={() => setFormOpen(true)}>
          New
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card padding="md" className="flex items-center gap-3">
          <Flame size={22} strokeWidth={2.2} className={summary?.streak ? 'text-warn-500' : 'text-slate-400'} />
          <div>
            <Text className="text-lg font-bold tabular-nums">{summary?.streak ?? 0}</Text>
            <Text variant="small">day streak</Text>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-3">
          <Target size={22} strokeWidth={2.2} className="text-brand-500" />
          <div>
            <Text className="text-lg font-bold tabular-nums">{summary?.activeGoals ?? 0}</Text>
            <Text variant="small">active goals</Text>
          </div>
        </Card>
        <Card padding="md" className="flex items-center gap-3">
          <ProgressRing pct={summary?.overallProgress ?? 0} size={40} strokeWidth={5} />
          <Text variant="small">overall progress</Text>
        </Card>
        <Link href="/goals/tasks" className="no-underline hover:no-underline">
          <Card padding="md" interactive className="flex items-center gap-3">
            {summary?.tasksOverdue ? (
              <CircleAlert size={22} strokeWidth={2.2} className="text-danger-500" />
            ) : (
              <ListChecks size={22} strokeWidth={2.2} className="text-brand-500" />
            )}
            <div>
              <Text className="text-lg font-bold tabular-nums">{summary?.tasksOpen ?? 0}</Text>
              <Text variant="small">open tasks{summary?.tasksOverdue ? ` · ${summary.tasksOverdue} overdue` : ''}</Text>
            </div>
          </Card>
        </Link>
      </div>

      {/* Goals grid */}
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((g) => <GoalCard key={g._id} goal={g} />)}
        </div>
      )}

      <LifeGoalForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function GoalCard({ goal }: { goal: LifeGoal }) {
  const pct = lifeGoalProgress(goal);
  return (
    <Link href={`/goals/${goal._id}`} className="no-underline hover:no-underline">
      <Card interactive className="flex h-full items-center gap-4">
        <ProgressRing pct={pct} size={56} color={goal.color} />
        <div className="min-w-0 flex-1">
          <Text className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
            {goal.icon} {goal.title}
          </Text>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[goal.status] ?? 'default'}>{goal.area}</Badge>
            {goal.targetValue ? (
              <Text variant="small" className="tabular-nums">
                {goal.currentValue}/{goal.targetValue} {goal.unit ?? ''}
              </Text>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
