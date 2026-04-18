import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { fmt, progressColor, cn } from '../lib/utils';
import { toMinorUnits } from '@finbuddy/shared';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/EmptyState';

interface Budget {
  _id: string;
  categoryId: { _id: string; name: string; icon: string; color: string } | string;
  amount: number;
  period: string;
  rollover: boolean;
  rolloverBalance: number;
}

interface Category { _id: string; name: string; icon: string; type: string; }

const FormSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  amount: z.coerce.number().positive(),
  period: z.enum(['monthly', 'yearly']),
  rollover: z.boolean().default(false),
});

type FormValues = z.infer<typeof FormSchema>;

export function Budgets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const currency = user?.currency ?? 'INR';
  const now = new Date();

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get<{ data: Budget[] }>('/api/budgets').then((r) => r.data.data),
  });

  const { data: actuals } = useQuery({
    queryKey: ['analytics', 'monthly', now.getFullYear(), now.getMonth() + 1],
    queryFn: () =>
      api.get<{ data: { totals: unknown[]; byCategory: Array<{ _id: string; total: number }> } }>(
        `/api/analytics/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
      ).then((r) => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories').then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { period: 'monthly', rollover: false },
  });

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      api.post('/api/budgets', {
        ...values,
        amount: toMinorUnits(values.amount, currency as 'INR'),
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['budgets'] });
      reset();
      setModalOpen(false);
    },
  });

  const deleteBudget = useMutation({
    mutationFn: (id: string) => api.delete(`/api/budgets/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budgets'] }),
  });

  const actualMap = Object.fromEntries((actuals?.byCategory ?? []).map((a) => [a._id, a.total]));

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Button onClick={() => setModalOpen(true)} size="sm">+ Add Budget</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : (budgets ?? []).length === 0 ? (
        <EmptyState
          icon="📋"
          title="No budgets set"
          description="Set monthly budgets to stay on track"
          action={{ label: '+ Add Budget', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {(budgets ?? []).map((budget) => {
            const cat = typeof budget.categoryId === 'object' ? budget.categoryId : null;
            const catId = typeof budget.categoryId === 'object' ? budget.categoryId._id : budget.categoryId;
            const actual = actualMap[catId] ?? 0;
            const effective = budget.amount + (budget.rollover ? budget.rolloverBalance : 0);
            const pct = effective > 0 ? Math.round((actual / effective) * 100) : 0;
            const variant = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'success';

            return (
              <Card key={budget._id} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat?.icon ?? '📦'}</span>
                    <span className="font-medium">{cat?.name ?? 'Category'}</span>
                    {pct >= 90 && <Badge variant="danger">⚠️ Over 90%</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{fmt(actual, currency)} / {fmt(effective, currency)}</span>
                    <button
                      onClick={() => { if (confirm('Delete budget?')) deleteBudget.mutate(budget._id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-danger-500 transition-opacity"
                      aria-label="Delete budget"
                    >🗑️</button>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                  <div
                    className={cn(
                      'h-2.5 rounded-full transition-all',
                      variant === 'danger' ? 'bg-danger-500' : variant === 'warn' ? 'bg-warn-500' : 'bg-success-500',
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-400">{pct}% used</span>
                  {budget.rollover && <span className="text-xs text-slate-400">Rollover: {fmt(budget.rolloverBalance, currency)}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Set Budget">
        <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
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
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('rollover')} className="rounded" />
            <span>Enable rollover (unspent carries to next month)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={save.isPending} className="flex-1">Save Budget</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
