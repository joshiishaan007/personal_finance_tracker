'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap } from 'lucide-react';
import { toMinorUnits, type Currency } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { useCreateInstantCard } from '@/hooks/useInstantCards';
import { useInvestments } from '@/hooks/useInvestments';
import type { CreateTransaction } from '@/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Text } from '@/components/ui/Text';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { cn } from '@/lib/utils';

const FormSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense', 'transfer', 'investment']),
  categoryId: z.string().min(1, 'Select a category'),
  date: z.string(),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque', 'other']),
  tags: z.string().optional(),
  investmentId: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface Category { _id: string; name: string; icon: string; type: string; }
interface Transaction {
  _id: string; amount: number; type: string; categoryId: string;
  date: string; note?: string; paymentMethod: string; tags: string[];
  investmentId?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  editTx?: Transaction | null;
  categories: Category[];
  // Pre-fill for a fresh transaction (e.g. natural-language quick-add); ignored when editing.
  prefill?: Partial<FormValues> | null;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export function TransactionForm({ open, onClose, editTx, categories, prefill }: Props) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';

  const [saveAsCard, setSaveAsCard] = useState(false);

  const createTx  = useCreateTransaction();
  const updateTx  = useUpdateTransaction(editTx?._id ?? '');
  const createCard = useCreateInstantCard();
  const isPending  = editTx ? updateTx.isPending : createTx.isPending;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
    },
  });

  const selectedType = watch('type');
  const filteredCategories = categories.filter((c) => c.type === selectedType);
  const isInvestment = selectedType === 'investment';
  const { data: investments } = useInvestments();

  useEffect(() => {
    if (editTx) {
      reset({
        amount: editTx.amount / 100,
        type: editTx.type as FormValues['type'],
        categoryId: editTx.categoryId,
        date: editTx.date.split('T')[0],
        note: editTx.note ?? '',
        paymentMethod: editTx.paymentMethod as FormValues['paymentMethod'],
        tags: editTx.tags.join(', '),
        investmentId: editTx.investmentId ?? '',
      });
    } else {
      reset({
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        ...prefill,
      });
    }
  }, [editTx, reset, open, prefill]);

  function onSubmit(values: FormValues) {
    const payload: CreateTransaction = {
      amount: toMinorUnits(values.amount, currency as Currency),
      type: values.type,
      categoryId: values.categoryId,
      date: new Date(values.date).toISOString(),
      note: values.note,
      paymentMethod: values.paymentMethod,
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      isRecurring: false,
      // Only an investment-type tx may link an investment wallet.
      investmentId: values.type === 'investment' && values.investmentId ? values.investmentId : undefined,
    };
    if (editTx) {
      updateTx.mutate(payload, { onSuccess: onClose });
    } else {
      createTx.mutate(payload, {
        onSuccess: () => {
          if (saveAsCard) {
            createCard.mutate({
              amount:        payload.amount,
              type:          payload.type,
              categoryId:    payload.categoryId,
              paymentMethod: payload.paymentMethod,
              note:          payload.note,
              tags:          payload.tags ?? [],
            });
          }
          setSaveAsCard(false);
          onClose();
        },
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTx ? 'Edit Transaction' : 'New Transaction'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Select
            label="Type"
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
              { value: 'transfer', label: 'Transfer' },
              { value: 'investment', label: 'Investment' },
            ]}
            {...register('type')}
          />
        </div>

        <Select
          label="Category"
          error={errors.categoryId?.message}
          options={[
            { value: '', label: 'Select category…' },
            ...filteredCategories.map((c) => ({ value: c._id, label: `${c.icon} ${c.name}` })),
          ]}
          {...register('categoryId')}
        />

        {isInvestment && (
          <Select
            label="Investment wallet (optional)"
            options={[
              { value: '', label: 'None' },
              ...(investments ?? []).map((i) => ({ value: i._id, label: i.name })),
            ]}
            {...register('investmentId')}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DatePicker
            label="Date"
            value={watch('date')}
            onChange={(v) => setValue('date', v)}
            error={errors.date?.message}
          />
          <Select
            label="Payment Method"
            options={PAYMENT_METHODS}
            {...register('paymentMethod')}
          />
        </div>

        <Textarea
          label="Note (optional)"
          placeholder="What was this for?"
          rows={2}
          {...register('note')}
        />
        <Input
          label="Tags (comma-separated)"
          placeholder="food, family, work…"
          {...register('tags')}
        />

        {/* Instant card toggle — only for new transactions */}
        {!editTx && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-ink-800/40 px-3 py-2.5">
            <Zap size={15} className="shrink-0 text-brand-500" />
            <div className="flex-1">
              <Text className="text-sm font-medium">Save as instant card</Text>
              <Text variant="small" className="text-slate-500">Pin for one-tap repeat with today&apos;s date</Text>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={saveAsCard}
              onClick={() => setSaveAsCard((v) => !v)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500',
                saveAsCard ? 'bg-brand-500' : 'bg-slate-300 dark:bg-ink-600',
              )}
            >
              <span
                className={cn(
                  'block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
                  saveAsCard ? 'translate-x-4' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="gradient" loading={isPending} className="flex-1">
            {editTx ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
