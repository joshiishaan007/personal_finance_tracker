'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pencil, AlertTriangle, Wallet, Info, SplitSquareHorizontal } from 'lucide-react';
import { fmt, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSpendingPlan } from '@/hooks/useSpendingPlan';
import { useCategories } from '@/hooks/useCategories';
import { Donut } from '@/components/charts/lazy';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/EmptyState';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { PlanEditor } from './PlanEditor';
import { SpendingPlanHistory } from './SpendingPlanHistory';

export function SpendingPlanView() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const [incomeFormOpen, setIncomeFormOpen] = useState(false);

  const { data, isLoading } = useSpendingPlan();
  const { data: categories } = useCategories();

  // The context-aware FAB links here with ?new=income — open the transaction form
  // preset to income, then strip the param so a refresh doesn't reopen it.
  useEffect(() => {
    if (searchParams.get('new') === 'income') {
      setIncomeFormOpen(true);
      router.replace('/spending-plan');
    }
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
        <div className="skeleton h-28 rounded-2xl" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <EmptyState icon={Wallet} title="Spending plan unavailable" description="Try refreshing the page." />
      </div>
    );
  }

  const { buckets, cycle, totalPercent } = data;
  const noIncome = cycle.source === 'none' || cycle.baseIncome <= 0;
  const donutData = buckets.map((b) => ({ name: b.name, value: b.allocated }));

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Heading level={2}>Spending Plan</Heading>
        <Button onClick={() => setEditorOpen(true)} size="sm" leftIcon={<Pencil size={16} strokeWidth={2.4} />}>
          Edit plan
        </Button>
      </div>

      <Card variant="glass">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Text as="span" variant="small" className="uppercase tracking-wide">
              {cycle.label}
            </Text>
            <Heading level={3} className="mt-1 tabular-nums">{fmt(cycle.baseIncome, currency)}</Heading>
            <Text variant="muted" className="mt-0.5">
              {cycle.source === 'none'
                ? 'No income yet this month — expenses still tracked'
                : 'Income so far this month'}
            </Text>
          </div>
          {!noIncome && (
            <div className="w-40 shrink-0">
              <Donut data={donutData} height={150} formatValue={(v) => fmt(v, currency)} />
            </div>
          )}
        </div>

        {noIncome && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-warn-50 dark:bg-warn-700/15 p-3">
            <Info size={16} className="mt-0.5 shrink-0 text-warn-700 dark:text-warn-500" />
            <Text variant="small" className="text-warn-700 dark:text-warn-500">
              Add your salary/income for this month to see allocations. Expenses are already counted.
            </Text>
          </div>
        )}

        {totalPercent !== 100 && (
          <div className="mt-3">
            <Badge variant="warn" className="gap-1">
              <AlertTriangle size={11} strokeWidth={2.4} /> Allocations total {totalPercent}% (should be 100%)
            </Badge>
          </div>
        )}
      </Card>

      {/* Unassigned categories callout — prompt to open editor with one tap */}
      {data.unassignedCategoryIds.length > 0 && (
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="w-full text-left"
        >
          <Card variant="glass" interactive className="flex items-start gap-3">
            <SplitSquareHorizontal size={18} className="mt-0.5 shrink-0 text-warn-600 dark:text-warn-400" />
            <div className="min-w-0 flex-1">
              <Text as="span" className="font-semibold text-slate-900 dark:text-slate-100">
                {data.unassignedCategoryIds.length} {data.unassignedCategoryIds.length === 1 ? 'category' : 'categories'} not counted
              </Text>
              <Text variant="small" className="mt-0.5">
                Transactions in these categories won&apos;t appear in any bucket.
                Tap to assign them — or split a broad category like &quot;Food &amp; Dining&quot; into
                &quot;Food&quot; (Needs) and &quot;Dining Out&quot; (Wants) for accurate tracking.
              </Text>
            </div>
            <Badge variant="warn" className="shrink-0">{data.unassignedCategoryIds.length}</Badge>
          </Card>
        </button>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {buckets.map((b) => {
          const isSavings = b.kind === 'savings';
          const pct = b.usedPctOfAllocated;
          const over = b.remaining < 0;

          return (
            <Card key={b.id} variant="glass">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Text
                    as="span"
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: b.color }}
                    aria-hidden
                  />
                  <Text as="span" className="font-semibold truncate text-slate-900 dark:text-slate-100">{b.name}</Text>
                </div>
                <Badge variant="default">{b.percent}%</Badge>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <Text as="span" className="font-bold tabular-nums text-slate-900 dark:text-slate-50">{fmt(b.used, currency)}</Text>
                <Text as="span" variant="small" className="tabular-nums">
                  {isSavings ? 'target ' : 'of '}{fmt(b.allocated, currency)}
                </Text>
              </div>

              <div className="w-full bg-slate-100 dark:bg-ink-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: b.color }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              <div className="flex justify-between items-center mt-2">
                <Text as="span" variant="small" className="font-semibold tabular-nums">{pct}% {isSavings ? 'saved' : 'used'}</Text>
                {isSavings ? (
                  <Text as="span" variant="small" className="tabular-nums text-success-600 dark:text-success-500">
                    {fmt(b.used, currency)} saved
                  </Text>
                ) : (
                  <Text
                    as="span"
                    variant="small"
                    className={cn('tabular-nums font-medium', over ? 'text-danger-500' : 'text-success-600 dark:text-success-500')}
                  >
                    {over ? `${fmt(-b.remaining, currency)} over` : `${fmt(b.remaining, currency)} left`}
                  </Text>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <SpendingPlanHistory />

      <PlanEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        buckets={buckets}
        assignments={data.assignments}
      />

      <TransactionForm
        open={incomeFormOpen}
        onClose={() => setIncomeFormOpen(false)}
        categories={categories ?? []}
        prefill={{ type: 'income' }}
      />
    </div>
  );
}
