'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFrequentTransactions, useCreateTransaction, type FrequentTemplate } from '@/hooks/useTransactions';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fmt } from '@/lib/utils';

function chipKey(t: FrequentTemplate): string {
  return `${t.categoryId}-${t.amount}-${t.paymentMethod}`;
}

export function QuickAddChips() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { data: templates } = useFrequentTransactions();
  const createTx = useCreateTransaction();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  if (!templates || templates.length === 0) return null;

  function add(t: FrequentTemplate) {
    const key = chipKey(t);
    setPendingKey(key);
    createTx.mutate(
      {
        amount: t.amount,
        type: 'expense',
        categoryId: t.categoryId,
        paymentMethod: t.paymentMethod,
        date: new Date().toISOString(),
        tags: [],
        isRecurring: false,
      },
      {
        onSuccess: () => { setCelebrate(true); setTimeout(() => setCelebrate(false), 1400); },
        onSettled: () => setPendingKey(null),
      },
    );
  }

  return (
    <div className="space-y-2">
      <Text variant="small" className="flex items-center gap-1.5 font-medium">
        <Zap size={13} strokeWidth={2.4} className="text-brand-500" /> Quick repeat
      </Text>
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => {
          const key = chipKey(t);
          return (
            <Button
              key={key}
              size="sm"
              variant="secondary"
              loading={pendingKey === key}
              disabled={createTx.isPending}
              onClick={() => add(t)}
              className="bg-white/60 dark:bg-ink-800/60"
            >
              {t.categoryIcon ? `${t.categoryIcon} ` : ''}
              {t.categoryName ?? 'Expense'} · {fmt(t.amount, currency)}
            </Button>
          );
        })}
      </div>
      <ConfettiBurst trigger={celebrate} />
    </div>
  );
}
