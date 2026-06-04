'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, TrendingUp, Trash2, Pencil, LineChart } from 'lucide-react';
import { fmt, cn } from '@/lib/utils';
import { toMinorUnits } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import {
  useGrossPL,
  useCreateGrossPL,
  useUpdateGrossPL,
  useDeleteGrossPL,
} from '@/hooks/useGrossPL';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { IconBadge } from '@/components/ui/IconBadge';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { ChartCard } from '@/components/charts/ChartCard';
import { AreaTrend } from '@/components/charts/lazy';
import type { GrossPLEntryView } from '@/shared';

const FormSchema = z.object({
  // <input type="month"> yields "YYYY-MM".
  month: z.string().min(1, 'Pick a month'),
  kind: z.enum(['profit', 'loss']),
  amount: z.coerce.number().positive('Enter an amount'),
  note: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

// "YYYY-MM" -> first-of-month UTC ISO string.
function monthInputToISO(value: string): string {
  const [y, m] = value.split('-').map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, 1)).toISOString();
}

// ISO -> "YYYY-MM" for the month input default.
function isoToMonthInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(iso: string): string {
  const d = new Date(iso);
  return `${MONTH_NAMES[d.getUTCMonth()] ?? ''} ${String(d.getUTCFullYear()).slice(2)}`;
}

export function GrossPLView() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';

  const { data, isLoading } = useGrossPL();
  const create = useCreateGrossPL();
  const update = useUpdateGrossPL();
  const remove = useDeleteGrossPL();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GrossPLEntryView | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { kind: 'profit' },
  });

  function openAdd() {
    setEditing(null);
    reset({ month: '', kind: 'profit', amount: undefined, note: '' });
    setModalOpen(true);
  }

  function openEdit(entry: GrossPLEntryView) {
    setEditing(entry);
    reset({
      month: isoToMonthInput(entry.month),
      kind: entry.amount < 0 ? 'loss' : 'profit',
      amount: Math.abs(entry.amount) / 100,
      note: entry.note ?? '',
    });
    setModalOpen(true);
  }

  function close() {
    setModalOpen(false);
    setEditing(null);
    reset();
  }

  function onSubmit(values: FormValues) {
    const magnitude = toMinorUnits(values.amount, currency as 'INR');
    const amount = values.kind === 'loss' ? -magnitude : magnitude;
    const payload = {
      month: monthInputToISO(values.month),
      amount,
      ...(values.note ? { note: values.note } : {}),
    };

    if (editing) {
      update.mutate({ id: editing._id, data: payload }, { onSuccess: close });
    } else {
      create.mutate(payload, { onSuccess: close });
    }
  }

  const summary = data;
  const entries = summary?.entries ?? [];
  const cumulative = summary?.cumulative ?? 0;
  const series = (summary?.cumulativeSeries ?? []).map((p) => ({
    label: monthLabel(p.month),
    value: p.value,
  }));
  const cumulativePositive = cumulative >= 0;

  // Newest first for the list; the chart/series stays ascending.
  const listEntries = [...entries].reverse();

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Heading level={2}>Gross P&amp;L</Heading>
        <Button onClick={openAdd} size="sm" leftIcon={<Plus size={16} strokeWidth={2.4} />}>
          Add Entry
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-[316px] rounded-2xl" />
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="No P&L entries yet"
          description="Log your monthly profit or loss to track a running gross total"
          action={{ label: 'Add Entry', onClick: openAdd }}
        />
      ) : (
        <>
          <StatCard
            label="Cumulative Gross P&L"
            value={cumulative}
            format={(n) => fmt(n, currency)}
            icon={TrendingUp}
            tone={cumulativePositive ? 'success' : 'danger'}
            gradient
          />

          <ChartCard
            title="Running Gross Total"
            subtitle="Cumulative profit/loss over time"
            empty={series.length === 0}
            emptyLabel="Add entries to see your trend"
          >
            <AreaTrend
              data={series}
              xKey="label"
              series={[{ key: 'value', label: 'Cumulative', colorVar: 'var(--chart-1)' }]}
              formatValue={(v) => fmt(v, currency)}
              formatY={(v) => `${Math.round(v / 100)}`}
            />
          </ChartCard>

          <div className="space-y-3">
            {listEntries.map((entry) => {
              const positive = entry.amount >= 0;
              return (
                <Card key={entry._id} variant="glass" interactive className="group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <IconBadge icon={TrendingUp} tone={positive ? 'success' : 'danger'} />
                      <div className="min-w-0">
                        <Text as="span" className="font-semibold block text-slate-900 dark:text-slate-100">
                          {monthLabel(entry.month)}
                        </Text>
                        {entry.note && (
                          <Text as="span" variant="small" className="truncate block">{entry.note}</Text>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Text
                        as="span"
                        className={cn(
                          'font-bold tabular-nums',
                          positive
                            ? 'text-success-600 dark:text-success-300'
                            : 'text-danger-600 dark:text-danger-300',
                        )}
                      >
                        {positive ? '+' : ''}{fmt(entry.amount, currency)}
                      </Text>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(entry)}
                        className="text-slate-400 hover:text-brand-500 p-1 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Edit entry"
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { if (confirm('Delete entry?')) remove.mutate(entry._id); }}
                        className="text-slate-400 hover:text-danger-500 p-1 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={close} title={editing ? 'Edit Entry' : 'Add P&L Entry'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Month" type="month" error={errors.month?.message} {...register('month')} />
          <Select
            label="Type"
            error={errors.kind?.message}
            options={[{ value: 'profit', label: 'Profit' }, { value: 'loss', label: 'Loss' }]}
            {...register('kind')}
          />
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input label="Note (optional)" error={errors.note?.message} {...register('note')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={close} className="flex-1">Cancel</Button>
            <Button type="submit" loading={create.isPending || update.isPending} className="flex-1">
              {editing ? 'Save Changes' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
