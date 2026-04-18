import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { fmt, fmtDate } from '../lib/utils';
import { toMinorUnits } from '@finbuddy/shared';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/EmptyState';

interface RecurringRule {
  _id: string;
  templateTransaction: { amount: number; type: string; note?: string; categoryId: string; paymentMethod: string };
  frequency: string;
  nextDueDate: string;
  autoPost: boolean;
  isActive: boolean;
}

interface Category { _id: string; name: string; icon: string; type: string; }

const FormSchema = z.object({
  note: z.string().max(500).optional(),
  amount: z.coerce.number().positive(),
  type: z.enum(['income', 'expense', 'transfer', 'investment']),
  categoryId: z.string().min(1),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque', 'other']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  nextDueDate: z.string(),
  autoPost: z.boolean().default(false),
});
type FormValues = z.infer<typeof FormSchema>;

export function Recurring() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const currency = user?.currency ?? 'INR';

  const { data: rules, isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => api.get<{ data: RecurringRule[] }>('/api/recurring').then((r) => r.data.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories').then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { type: 'expense', paymentMethod: 'cash', frequency: 'monthly', autoPost: false, nextDueDate: new Date().toISOString().split('T')[0] },
  });

  const selectedType = watch('type');
  const filteredCats = (categories ?? []).filter((c) => c.type === selectedType);

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const { note, amount, type, categoryId, paymentMethod, frequency, nextDueDate, autoPost } = values;
      return api.post('/api/recurring', {
        templateTransaction: { amount: toMinorUnits(amount, currency as 'INR'), type, categoryId, paymentMethod, note, tags: [] },
        frequency,
        nextDueDate: new Date(nextDueDate).toISOString(),
        autoPost,
        isActive: true,
      });
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['recurring'] }); reset(); setModalOpen(false); },
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.patch(`/api/recurring/${id}`, { isActive: active }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => api.delete(`/api/recurring/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recurring'] }),
  });

  const totalMonthly = (rules ?? [])
    .filter((r) => r.isActive && r.templateTransaction.type === 'expense')
    .reduce((s, r) => {
      const m = r.frequency === 'monthly' ? r.templateTransaction.amount : r.frequency === 'yearly' ? Math.round(r.templateTransaction.amount / 12) : 0;
      return s + m;
    }, 0);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring</h1>
          <p className="text-sm text-slate-500">Monthly subscriptions: {fmt(totalMonthly, currency)}</p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">+ Add Rule</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      ) : (rules ?? []).length === 0 ? (
        <EmptyState icon="🔄" title="No recurring rules" description="Set up subscriptions and regular payments to track them automatically" action={{ label: '+ Add Rule', onClick: () => setModalOpen(true) }} />
      ) : (
        <div className="space-y-2">
          {(rules ?? []).map((rule) => (
            <Card key={rule._id} className="flex items-center gap-4 group">
              <div className={`w-2 h-10 rounded-full flex-shrink-0 ${rule.isActive ? 'bg-success-500' : 'bg-slate-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{rule.templateTransaction.note ?? 'Recurring'}</p>
                <p className="text-xs text-slate-500">{rule.frequency} · Next: {fmtDate(rule.nextDueDate)} · {rule.autoPost ? '⚡ Auto-post' : '✋ Manual'}</p>
              </div>
              <span className={`font-semibold text-sm ${rule.templateTransaction.type === 'income' ? 'text-success-500' : 'text-danger-500'}`}>
                {fmt(rule.templateTransaction.amount, currency)}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary" onClick={() => toggle.mutate({ id: rule._id, active: !rule.isActive })}>
                  {rule.isActive ? 'Pause' : 'Resume'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete rule?')) deleteRule.mutate(rule._id); }}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Recurring Rule">
        <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <Input label="Description" placeholder="Netflix, Salary, Rent…" {...register('note')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount" type="number" step="0.01" error={errors.amount?.message} {...register('amount')} />
            <Select label="Type" options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }, { value: 'investment', label: 'Investment' }]} {...register('type')} />
          </div>
          <Select label="Category" error={errors.categoryId?.message} options={[{ value: '', label: 'Select…' }, ...filteredCats.map((c) => ({ value: c._id, label: `${c.icon} ${c.name}` }))]} {...register('categoryId')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Frequency" options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }]} {...register('frequency')} />
            <Input label="First Due Date" type="date" {...register('nextDueDate')} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('autoPost')} className="rounded" />
            <span>Auto-post transactions (no confirmation needed)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={save.isPending} className="flex-1">Create Rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
