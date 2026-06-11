'use client';

import { useState } from 'react';
import { History, ChevronDown } from 'lucide-react';
import { fmt, cn } from '@/lib/utils';
import { useSpendingPlanHistory } from '@/hooks/useSpendingPlan';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

export function SpendingPlanHistory() {
  const { data: months = [] } = useSpendingPlanHistory();
  const [expanded, setExpanded] = useState(false);

  if (months.length === 0) return null;

  return (
    <Card variant="glass" padding="sm">
      <Button
        type="button"
        variant="ghost"
        className="flex items-center justify-between w-full -mx-1 px-1 min-h-0 h-auto"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <History size={15} strokeWidth={2.4} className="text-slate-500" />
          <Text className="text-sm font-semibold">History</Text>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={2.4}
          className={cn('text-slate-400 transition-transform', expanded && 'rotate-180')}
        />
      </Button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {months.map((m) => (
            <div key={m.month} className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] p-3">
              <div className="flex items-baseline justify-between mb-2">
                <Text as="span" className="text-sm font-semibold">{m.label}</Text>
                <Text as="span" variant="small" className="tabular-nums text-slate-400">
                  income {fmt(m.baseIncome, m.currency)}
                </Text>
              </div>
              <div className="space-y-1.5">
                {m.buckets.map((b) => {
                  const isSavings = b.kind === 'savings';
                  const diff = b.allocated - b.spent; // +ve = under target
                  return (
                    <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Text
                          as="span"
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: b.color }}
                          aria-hidden
                        />
                        <Text as="span" className="truncate">{b.name}</Text>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 tabular-nums">
                        <Text as="span" variant="small" className="text-slate-500">
                          {fmt(b.spent, m.currency)} / {fmt(b.allocated, m.currency)}
                        </Text>
                        {isSavings ? (
                          <Text as="span" variant="small" className="font-medium text-success-600 dark:text-success-500">
                            {fmt(b.spent, m.currency)} saved
                          </Text>
                        ) : (
                          <Text
                            as="span"
                            variant="small"
                            className={cn('font-medium', diff >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-500')}
                          >
                            {diff >= 0 ? `${fmt(diff, m.currency)} saved` : `${fmt(-diff, m.currency)} over`}
                          </Text>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
