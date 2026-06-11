'use client';

import { PieChart } from 'lucide-react';
import { fmt, cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Link } from '@/components/ui/Link';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import type { SpendingPlanView } from '@/shared';

// Compact, props-only spending-plan card for the dashboard. The page widget owns
// the fetch; this just renders the current month's buckets.
export function SpendingPlanSummary({ data, currency }: { data?: SpendingPlanView; currency: string }) {
  const buckets = data?.buckets ?? [];
  const noIncome = !data || data.cycle.source === 'none' || data.cycle.baseIncome <= 0;

  return (
    <Card>
      <SectionHeader
        title="Spending Plan"
        subtitle={data?.cycle.label}
        icon={PieChart}
        action={<Link href="/spending-plan" className="text-xs">View</Link>}
      />
      <div className="mt-4">
        {noIncome ? (
          <EmptyState icon={PieChart} title="No income yet" description="Add this month's income to see allocations" />
        ) : (
          <div className="space-y-3">
            {buckets.map((b) => {
              const pct = Math.min(b.usedPctOfAllocated, 100);
              const over = b.remaining < 0;
              const isSavings = b.kind === 'savings';
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between gap-2 text-sm mb-1">
                    <Text as="span" className="font-medium truncate">{b.name}</Text>
                    <Text as="span" variant="small" className="tabular-nums shrink-0">
                      {fmt(b.used, currency)} / {fmt(b.allocated, currency)}
                    </Text>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-ink-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: b.color }}
                    />
                  </div>
                  {!isSavings && (
                    <Text
                      as="span"
                      variant="small"
                      className={cn('tabular-nums', over ? 'text-danger-500' : 'text-success-600 dark:text-success-500')}
                    >
                      {over ? `${fmt(-b.remaining, currency)} over` : `${fmt(b.remaining, currency)} left`}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
