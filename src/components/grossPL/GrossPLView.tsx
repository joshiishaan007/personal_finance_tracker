'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, TrendingUp, TrendingDown, Trash2, Pencil, LineChart, SlidersHorizontal } from 'lucide-react';
import { fmt, cn } from '@/lib/utils';
import { toMinorUnits } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import {
  useGrossPL,
  useCreateGrossPL,
  useUpdateGrossPL,
  useDeleteGrossPL,
} from '@/hooks/useGrossPL';
import { useTransactionPL } from '@/hooks/useTransactionPL';
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
import { ChartCard } from '@/components/charts/ChartCard';
import { PLBarChart } from '@/components/charts/lazy';
import type { GrossPLEntryView } from '@/shared';

const FormSchema = z.object({
  month: z.string().min(1, 'Pick a month'),
  kind: z.enum(['profit', 'loss']),
  amount: z.coerce.number().positive('Enter an amount'),
  note: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

function monthInputToISO(value: string): string {
  const [y, m] = value.split('-').map(Number);
  return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, 1)).toISOString();
}

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

  const { data: txPL, isLoading: txLoading } = useTransactionPL();
  const { data: manualData, isLoading: manualLoading } = useGrossPL();
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

  function close() { setModalOpen(false); setEditing(null); reset(); }

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

  // Transaction-based numbers
  const txCumulative = txPL?.cumulative ?? 0;
  const txMonths = txPL?.months ?? [];
  const txPositive = txCumulative >= 0;

  // Manual adjustment numbers
  const manualEntries = manualData?.entries ?? [];
  const manualCumulative = manualData?.cumulative ?? 0;
  const manualPositive = manualCumulative >= 0;
  const listEntries = [...manualEntries].reverse();

  // Combined
  const combined = txCumulative + manualCumulative;
  const combinedPositive = combined >= 0;

  const fmtCur = (n: number) => fmt(n, currency);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <Heading level={2}>Gross P&amp;L</Heading>

      {/* ── Transaction-based P&L ── */}
      {txLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-[300px] rounded-2xl" />
        </div>
      ) : txMonths.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="No transaction data yet"
          description="Add income and expense transactions to see your monthly P&L"
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard
              label="All-time Net"
              value={txCumulative}
              format={fmtCur}
              icon={txPositive ? TrendingUp : TrendingDown}
              tone={txPositive ? 'success' : 'danger'}
              gradient
            />
            <StatCard
              label="Total Income"
              value={txPL?.totalIncome ?? 0}
              format={fmtCur}
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label="Total Expense"
              value={txPL?.totalExpense ?? 0}
              format={fmtCur}
              icon={TrendingDown}
              tone="danger"
            />
          </div>

          <ChartCard
            title="Monthly P&L from Transactions"
            subtitle="Green = profit month · Red = loss month"
            empty={txMonths.length === 0}
            emptyLabel="No transaction data"
          >
            <PLBarChart
              data={txMonths}
              formatValue={fmtCur}
              formatY={(v) => `${Math.round(v / 100)}`}
            />
          </ChartCard>
        </>
      )}

      {/* ── Manual Adjustments ── */}
      <div className="border-t border-slate-200 dark:border-white/10 pt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <Heading level={5}>Manual Adjustments</Heading>
          </div>
          <Text variant="small" className="text-slate-400">Off-app income, business P&amp;L, etc.</Text>
        </div>

        {/* Combined total when there are both sources */}
        {manualEntries.length > 0 && txMonths.length > 0 && (
          <Card variant="glass" className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <Text variant="small" className="uppercase tracking-wide text-slate-500 dark:text-slate-400">Combined Gross P&amp;L</Text>
              <Text
                className={cn(
                  'font-bold text-2xl tabular-nums mt-0.5',
                  combinedPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-500',
                )}
              >
                {combinedPositive ? '+' : ''}{fmtCur(combined)}
              </Text>
            </div>
            <Badge variant={combinedPositive ? 'success' : 'danger'} className="shrink-0 text-sm">
              Transactions {combinedPositive ? '+' : ''}{fmtCur(txCumulative)} · Adjustments {manualCumulative >= 0 ? '+' : ''}{fmtCur(manualCumulative)}
            </Badge>
          </Card>
        )}

        {!manualLoading && manualEntries.length === 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-4">
            <Text variant="muted">No manual entries yet. Add one for off-app income or business P&amp;L.</Text>
            <Button size="sm" onClick={openAdd} leftIcon={<Plus size={15} strokeWidth={2.4} />}>Add</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              {manualEntries.length > 0 && (
                <Text variant="small">
                  Cumulative: <Text as="span" className={cn('font-semibold tabular-nums', manualPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-500')}>{manualPositive ? '+' : ''}{fmtCur(manualCumulative)}</Text>
                </Text>
              )}
              <Button size="sm" variant="secondary" onClick={openAdd} leftIcon={<Plus size={15} strokeWidth={2.4} />} className="ml-auto">
                Add entry
              </Button>
            </div>

            <div className="space-y-3">
              {listEntries.map((entry) => {
                const positive = entry.amount >= 0;
                return (
                  <Card key={entry._id} variant="glass" interactive className="group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <IconBadge icon={positive ? TrendingUp : TrendingDown} tone={positive ? 'success' : 'danger'} />
                        <div className="min-w-0">
                          <Text as="span" className="font-semibold block text-slate-900 dark:text-slate-100">{monthLabel(entry.month)}</Text>
                          {entry.note && <Text as="span" variant="small" className="truncate block">{entry.note}</Text>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Text as="span" className={cn('font-bold tabular-nums', positive ? 'text-success-600 dark:text-success-300' : 'text-danger-600 dark:text-danger-300')}>
                          {positive ? '+' : ''}{fmtCur(entry.amount)}
                        </Text>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(entry)} className="text-slate-400 hover:text-brand-500 p-1 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Edit">
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (confirm('Delete entry?')) remove.mutate(entry._id); }} className="text-slate-400 hover:text-danger-500 p-1 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Delete">
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
      </div>

      <Modal open={modalOpen} onClose={close} title={editing ? 'Edit Entry' : 'Add Adjustment'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Month" type="month" error={errors.month?.message} {...register('month')} />
          <Select label="Type" error={errors.kind?.message} options={[{ value: 'profit', label: 'Profit' }, { value: 'loss', label: 'Loss' }]} {...register('kind')} />
          <Input label="Amount" type="number" step="0.01" min="0" error={errors.amount?.message} {...register('amount')} />
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
