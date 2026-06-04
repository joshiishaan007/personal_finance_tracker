'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Repeat, Zap, Hand, CalendarClock } from 'lucide-react';
import { fmt, fmtDate, cn } from '@/lib/utils';
import { toMinorUnits, type Currency } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import {
  useRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
} from '@/hooks/useRecurring';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { IconBadge } from '@/components/ui/IconBadge';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard } from '@/components/SkeletonLoader';

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

const FREQ_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export function RecurringView() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const currency = user?.currency ?? 'INR';

  const { data: rules, isLoading } = useRecurring();
  const { data: categories } = useCategories();

  const save = useCreateRecurring();
  const toggle = useUpdateRecurring();
  const deleteRule = useDeleteRecurring();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { type: 'expense', paymentMethod: 'cash', frequency: 'monthly', autoPost: false, nextDueDate: new Date().toISOString().split('T')[0] },
  });

  const selectedType = watch('type');
  const autoPost = watch('autoPost');
  const filteredCats = (categories ?? []).filter((c) => c.type === selectedType);

  function onSubmit(values: FormValues) {
    const { note, amount, type, categoryId, paymentMethod, frequency, nextDueDate, autoPost } = values;
    save.mutate(
      {
        templateTransaction: { amount: toMinorUnits(amount, currency as Currency), type, categoryId, paymentMethod, note, tags: [] },
        frequency,
        nextDueDate: new Date(nextDueDate).toISOString(),
        autoPost,
        isActive: true,
      },
      { onSuccess: () => { reset(); setModalOpen(false); } },
    );
  }

  const activeRules = rules ?? [];

  const totalMonthly = activeRules
    .filter((r) => r.isActive && r.templateTransaction.type === 'expense')
    .reduce((s, r) => {
      const m = r.frequency === 'monthly' ? r.templateTransaction.amount : r.frequency === 'yearly' ? Math.round(r.templateTransaction.amount / 12) : 0;
      return s + m;
    }, 0);

  const activeCount = activeRules.filter((r) => r.isActive).length;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading level={1} className="text-2xl">Recurring</Heading>
          <Text variant="small" className="mt-0.5">Subscriptions and regular payments</Text>
        </div>
        <Button
          size="sm"
          variant="gradient"
          leftIcon={<Plus size={16} strokeWidth={2.4} />}
          onClick={() => setModalOpen(true)}
        >
          Add Rule
        </Button>
      </div>

      {!isLoading && activeRules.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Monthly outflow"
            value={totalMonthly}
            format={(n) => fmt(Math.round(n), currency)}
            icon={Repeat}
            tone="accent"
          />
          <StatCard
            label="Active rules"
            value={activeCount}
            format={(n) => String(Math.round(n))}
            icon={CalendarClock}
            tone="aqua"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-20" />)}</div>
      ) : activeRules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring rules"
          description="Set up subscriptions and regular payments to track them automatically"
          action={{ label: 'Add Rule', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {activeRules.map((rule) => {
            const isIncome = rule.templateTransaction.type === 'income';
            return (
              <Card key={rule._id} variant="glass" padding="sm" className="group flex items-center gap-3">
                <IconBadge icon={Repeat} tone={rule.isActive ? 'brand' : 'warn'} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Text className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {rule.templateTransaction.note ?? 'Recurring'}
                    </Text>
                    <Badge variant={rule.isActive ? 'brand' : 'default'}>{FREQ_LABEL[rule.frequency] ?? rule.frequency}</Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Text as="span" variant="small">Next {fmtDate(rule.nextDueDate)}</Text>
                    <Text as="span" variant="small" className="inline-flex items-center gap-0.5">
                      {rule.autoPost
                        ? <><Zap size={12} strokeWidth={2.4} className="text-warn-500" /> Auto</>
                        : <><Hand size={12} strokeWidth={2.2} className="text-slate-400" /> Manual</>}
                    </Text>
                  </div>
                </div>
                <Text
                  as="span"
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    isIncome ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400',
                  )}
                >
                  {fmt(rule.templateTransaction.amount, currency)}
                </Text>
                <div className="flex gap-1.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <Button size="sm" variant="secondary" onClick={() => toggle.mutate({ id: rule._id, data: { isActive: !rule.isActive } })}>
                    {rule.isActive ? 'Pause' : 'Resume'}
                  </Button>
                  <Button size="sm" variant="ghost" className="hover:text-danger-500" onClick={() => { if (confirm('Delete rule?')) deleteRule.mutate(rule._id); }}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Recurring Rule">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Button
            type="button"
            variant={autoPost ? 'primary' : 'secondary'}
            className="w-full justify-start"
            leftIcon={autoPost ? <Zap size={16} strokeWidth={2.4} /> : <Hand size={16} strokeWidth={2.2} />}
            onClick={() => setValue('autoPost', !autoPost, { shouldDirty: true })}
            aria-pressed={autoPost}
          >
            {autoPost ? 'Auto-post enabled' : 'Auto-post off — confirm each time'}
          </Button>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" variant="gradient" loading={save.isPending} className="flex-1">Create Rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
