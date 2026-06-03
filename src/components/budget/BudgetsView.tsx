'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Wallet, TrendingDown, Trash2, AlertTriangle, PiggyBank, ClipboardList } from 'lucide-react';
import { fmt, cn, progressColor } from '@/lib/utils';
import { toMinorUnits } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useBudgets, useMonthlyActuals, useCreateBudget, useDeleteBudget } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Label } from '@/components/ui/Label';
import { IconBadge } from '@/components/ui/IconBadge';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';

const FormSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  amount: z.coerce.number().positive(),
  period: z.enum(['monthly', 'yearly']),
  rollover: z.boolean().default(false),
});

type FormValues = z.infer<typeof FormSchema>;

// Tailwind class for the gradient progress bar, keyed off progressColor's text token.
const barClass: Record<string, string> = {
  'text-success-500': 'bg-gradient-to-r from-success-400 to-success-500',
  'text-warn-500': 'bg-gradient-to-r from-warn-400 to-warn-500',
  'text-danger-500': 'bg-gradient-to-r from-danger-400 to-danger-500',
};

export function BudgetsView() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const currency = user?.currency ?? 'INR';
  const now = new Date();

  const { data: budgets, isLoading } = useBudgets();
  const { data: actuals } = useMonthlyActuals(now.getFullYear(), now.getMonth() + 1);
  const { data: categories } = useCategories();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { period: 'monthly', rollover: false },
  });

  const save = useCreateBudget();
  const deleteBudget = useDeleteBudget();

  function onSubmit(values: FormValues) {
    save.mutate(
      {
        ...values,
        amount: toMinorUnits(values.amount, currency as 'INR'),
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      },
      {
        onSuccess: () => {
          reset();
          setModalOpen(false);
        },
      },
    );
  }

  const actualMap = Object.fromEntries((actuals?.byCategory ?? []).map((a) => [a._id, a.total]));
  const list = budgets ?? [];

  const totalBudgeted = list.reduce(
    (sum, b) => sum + b.amount + (b.rollover ? b.rolloverBalance : 0),
    0,
  );
  const totalSpent = list.reduce((sum, b) => {
    const catId = typeof b.categoryId === 'object' ? b.categoryId._id : b.categoryId;
    return sum + (actualMap[catId] ?? 0);
  }, 0);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Heading level={2}>Budgets</Heading>
        <Button onClick={() => setModalOpen(true)} size="sm" leftIcon={<Plus size={16} strokeWidth={2.4} />}>
          Add Budget
        </Button>
      </div>

      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Budgeted" value={totalBudgeted} format={(n) => fmt(n, currency)} icon={Wallet} tone="brand" gradient />
          <StatCard label="Total Spent" value={totalSpent} format={(n) => fmt(n, currency)} icon={TrendingDown} tone="danger" />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No budgets set"
          description="Set monthly budgets to stay on track"
          action={{ label: 'Add Budget', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((budget) => {
            const cat = typeof budget.categoryId === 'object' ? budget.categoryId : null;
            const catId = typeof budget.categoryId === 'object' ? budget.categoryId._id : budget.categoryId;
            const actual = actualMap[catId] ?? 0;
            const effective = budget.amount + (budget.rollover ? budget.rolloverBalance : 0);
            const pct = effective > 0 ? Math.round((actual / effective) * 100) : 0;
            const remaining = effective - actual;
            const tone = progressColor(pct);

            return (
              <Card key={budget._id} variant="glass" interactive className="group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <IconBadge icon={PiggyBank} tone={pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'success'} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Text as="span" aria-hidden>{cat?.icon ?? '📦'}</Text>
                        <Text as="span" className="font-semibold truncate text-slate-900 dark:text-slate-100">{cat?.name ?? 'Category'}</Text>
                      </div>
                      <Text as="span" variant="small" className="capitalize">{budget.period}</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {pct >= 90 && (
                      <Badge variant="danger" className="gap-1">
                        <AlertTriangle size={11} strokeWidth={2.4} /> Over 90%
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (confirm('Delete budget?')) deleteBudget.mutate(budget._id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-danger-500 transition-opacity p-1"
                      aria-label="Delete budget"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-1.5">
                  <Text as="span" className="font-bold tabular-nums text-slate-900 dark:text-slate-50">{fmt(actual, currency)}</Text>
                  <Text as="span" variant="small" className="tabular-nums">of {fmt(effective, currency)}</Text>
                </div>

                <div className="w-full bg-slate-100 dark:bg-ink-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={cn('h-2.5 rounded-full transition-all duration-700 ease-out', barClass[tone])}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
                  <Text as="span" variant="small" className={cn('font-semibold', tone)}>{pct}% used</Text>
                  <Text as="span" variant="small" className="tabular-nums">
                    {remaining >= 0 ? `${fmt(remaining, currency)} left` : `${fmt(-remaining, currency)} over`}
                  </Text>
                </div>
                {budget.rollover && (
                  <Text as="span" variant="small" className="mt-1 block">Rollover: {fmt(budget.rolloverBalance, currency)}</Text>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Set Budget">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Category"
            error={errors.categoryId?.message}
            options={[
              { value: '', label: 'Select category…' },
              ...(categories ?? []).filter((c) => c.type === 'expense').map((c) => ({ value: c._id, label: c.name })),
            ]}
            {...register('categoryId')}
          />
          <Input label="Monthly Limit" type="number" step="0.01" error={errors.amount?.message} {...register('amount')} />
          <Select label="Period" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} {...register('period')} />
          <Label className="flex items-center gap-2 cursor-pointer font-normal">
            <Checkbox {...register('rollover')} />
            <Text as="span">Enable rollover (unspent carries to next month)</Text>
          </Label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={save.isPending} className="flex-1">Save Budget</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
