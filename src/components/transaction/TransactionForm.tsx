'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Users, Plus, X, AlertTriangle, CheckCircle2, Clock, HandCoins, Trash2 } from 'lucide-react';
import { toMinorUnits, type Currency } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCreateInstantCard, useUpdateInstantCard, useDeleteInstantCard, type InstantCard } from '@/hooks/useInstantCards';
import { useCreateDebts, useUpdateDebt, useTransactionDebts, useDebtSummary } from '@/hooks/useDebts';
import { useInvestments } from '@/hooks/useInvestments';
import type { CreateTransaction, CreateDebt } from '@/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { DatePicker } from '@/components/ui/DatePicker';
import { cn } from '@/lib/utils';
import { fmt } from '@/lib/utils';

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
  // Instant-card editor mode — the form creates/updates an InstantCard and NEVER
  // a transaction. Used by the instant-cards tray's Add and per-card Edit.
  cardMode?: boolean;
  editCard?: InstantCard | null;
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

export function TransactionForm({ open, onClose, editTx, categories, prefill, cardMode = false, editCard = null }: Props) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';

  const [saveAsCard, setSaveAsCard] = useState(false);
  const [splits, setSplits] = useState<{ name: string; amount: string; note: string }[]>([]);
  // "I owe someone" mode — creates an i_owe_them debt instead of a transaction.
  const [oweMode, setOweMode] = useState(false);
  const [oweName, setOweName] = useState('');

  const createTx    = useCreateTransaction();
  const updateTx    = useUpdateTransaction(editTx?._id ?? '');
  const deleteTx    = useDeleteTransaction();
  const createCard  = useCreateInstantCard();
  const updateCard  = useUpdateInstantCard();
  const deleteCard  = useDeleteInstantCard();
  const createDebts = useCreateDebts();
  const updateDebt  = useUpdateDebt();
  const isPending   = cardMode
    ? (editCard ? updateCard.isPending : createCard.isPending)
    : editTx ? updateTx.isPending : oweMode ? createDebts.isPending : createTx.isPending;

  // Existing debts linked to the transaction being edited.
  const { data: txDebts = [] } = useTransactionDebts(editTx?._id);
  // Global pending summary — used to warn about potential duplicates on pre-sourceTxId debts.
  const { data: debtSummary = [] } = useDebtSummary();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
    },
  });

  const selectedType = watch('type');
  const watchedAmount = watch('amount');
  const filteredCategories = categories.filter((c) => c.type === selectedType);
  const isInvestment = selectedType === 'investment';
  const { data: investments } = useInvestments();

  // "I owe someone" only applies to expenses; drop it if the type changes away.
  useEffect(() => {
    if (selectedType !== 'expense') setOweMode(false);
  }, [selectedType]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (cardMode) {
      reset(editCard
        ? {
            amount: editCard.amount / 100,
            type: editCard.type as FormValues['type'],
            categoryId: editCard.categoryId,
            date: today,
            note: editCard.note ?? '',
            paymentMethod: editCard.paymentMethod as FormValues['paymentMethod'],
            tags: editCard.tags.join(', '),
            investmentId: '',
          }
        : { type: 'expense', date: today, paymentMethod: 'cash' });
    } else if (editTx) {
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
        date: today,
        paymentMethod: 'cash',
        ...prefill,
      });
    }
    setSplits([]);
    setSaveAsCard(false);
    setOweMode(false);
    setOweName('');
  }, [editTx, editCard, cardMode, reset, open, prefill]);

  // ── Amount validation ──────────────────────────────────────────────────────
  const txAmountMinor = toMinorUnits(Number(watchedAmount) || 0, currency as Currency);
  const existingPendingTotal = txDebts
    .filter((d) => d.status === 'pending')
    .reduce((s, d) => s + d.amount, 0);
  const newSplitsTotal = splits.reduce((s, sp) => {
    const v = parseFloat(sp.amount);
    return s + (isNaN(v) ? 0 : toMinorUnits(v, currency as Currency));
  }, 0);
  // Projected = existing pending + whatever fireDebts will add (same-name splits ADD on top,
  // so no deduction is correct — any new amount pushes the total higher regardless of name match).
  const projectedTotal = existingPendingTotal + newSplitsTotal;
  const splitOverflow = txAmountMinor > 0 && projectedTotal > txAmountMinor;

  // ── Debt helpers ───────────────────────────────────────────────────────────
  async function fireDebts(sourceTxId?: string, incurredAtISO?: string) {
    const validSplits = splits.filter((s) => s.name.trim() && parseFloat(s.amount) > 0);
    if (validSplits.length === 0) return;

    const toCreate: CreateDebt[] = [];

    for (const s of validSplits) {
      const newAmt = toMinorUnits(parseFloat(s.amount), currency as Currency);
      // In edit mode: if a pending debt with this friend name exists for this tx, add to it.
      const existing = sourceTxId && editTx
        ? txDebts.find(
            (d) => d.status === 'pending' && d.friendName.toLowerCase() === s.name.trim().toLowerCase(),
          )
        : undefined;

      if (existing) {
        // Aggregate amount; preserve existing note unless user supplied a new one.
        updateDebt.mutate({ id: existing._id, data: {
          amount: existing.amount + newAmt,
          ...(s.note.trim() ? { note: s.note.trim() } : {}),
        }});
      } else {
        toCreate.push({
          friendName: s.name.trim(),
          amount: newAmt,
          note: s.note.trim() || undefined,
          direction: 'they_owe_me',
          // The date you paid for them — shown alongside the reimbursement income on settle.
          incurredAt: incurredAtISO,
          sourceTxId,
        });
      }
    }

    if (toCreate.length > 0) createDebts.mutate(toCreate);
  }

  function onSubmit(values: FormValues) {
    // Instant-card editor: create/update a card only — never a transaction.
    if (cardMode) {
      const cardData = {
        amount:        toMinorUnits(values.amount, currency as Currency),
        type:          values.type,
        categoryId:    values.categoryId,
        paymentMethod: values.paymentMethod,
        note:          values.note,
        tags:          values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (editCard) updateCard.mutate({ id: editCard._id, data: cardData }, { onSuccess: onClose });
      else createCard.mutate(cardData, { onSuccess: onClose });
      return;
    }

    if (splitOverflow) return; // blocked by UI already, belt-and-suspenders

    // "I owe someone": no money has left your account yet, so create a borrow debt
    // (not a transaction). The repayment expense is created when you mark it done.
    // In edit mode this CONVERTS the expense: the original tx is deleted (it's
    // recreated as an expense when the debt is marked repaid).
    if (oweMode) {
      if (!oweName.trim()) return;
      createDebts.mutate(
        [{
          friendName:    oweName.trim(),
          amount:        toMinorUnits(values.amount, currency as Currency),
          note:          values.note,
          direction:     'i_owe_them',
          incurredAt:    new Date(values.date).toISOString(),
          categoryId:    values.categoryId,
          paymentMethod: values.paymentMethod,
        }],
        {
          onSuccess: () => {
            if (editTx) deleteTx.mutate(editTx._id);
            setOweMode(false); setOweName(''); onClose();
          },
        },
      );
      return;
    }

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

    const incurredAtISO = new Date(values.date).toISOString();
    const maybeSaveCard = () => {
      if (!saveAsCard) return;
      createCard.mutate({
        amount:        payload.amount,
        type:          payload.type,
        categoryId:    payload.categoryId,
        paymentMethod: payload.paymentMethod,
        note:          payload.note,
        tags:          payload.tags ?? [],
      });
    };

    if (editTx) {
      updateTx.mutate(payload, {
        onSuccess: () => {
          maybeSaveCard();
          void fireDebts(editTx._id, incurredAtISO);
          setSaveAsCard(false);
          setSplits([]);
          onClose();
        },
      });
    } else {
      createTx.mutate(payload, {
        onSuccess: (txId) => {
          maybeSaveCard();
          void fireDebts(txId, incurredAtISO);
          setSaveAsCard(false);
          setSplits([]);
          onClose();
        },
      });
    }
  }

  const showSplits = (selectedType === 'expense' || selectedType === 'transfer') && !oweMode && !cardMode;
  const showOweToggle = selectedType === 'expense' && !cardMode;

  const title = cardMode
    ? (editCard ? 'Edit instant card' : 'New instant card')
    : editTx ? 'Edit Transaction' : 'New Transaction';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        cardMode ? (
          <div className="flex gap-3">
            {editCard && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => deleteCard.mutate(editCard._id, { onSuccess: onClose })}
                loading={deleteCard.isPending}
                className="hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30"
                leftIcon={<Trash2 size={16} strokeWidth={2.2} />}
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" form="transaction-form" variant="gradient" loading={isPending} className="flex-1">
              {editCard ? 'Save card' : 'Add card'}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" form="transaction-form" variant="gradient" loading={isPending} disabled={splitOverflow || (oweMode && !oweName.trim())} className="flex-1">
              {oweMode ? 'Add what I owe' : editTx ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        )
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        {isInvestment && !cardMode && (
          <Select
            label="Investment wallet (optional)"
            options={[
              { value: '', label: 'None' },
              ...(investments ?? []).map((i) => ({ value: i._id, label: i.name })),
            ]}
            {...register('investmentId')}
          />
        )}

        <div className={cn('grid gap-3', cardMode ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
          {/* Instant cards have no date — they apply today's date when used. */}
          {!cardMode && (
            <DatePicker
              label={oweMode ? 'Date money was used' : 'Date'}
              value={watch('date')}
              onChange={(v) => setValue('date', v)}
              error={errors.date?.message}
            />
          )}
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

        {/* I owe someone — sits directly above "Collect from friends" (its inverse). */}
        {showOweToggle && (
          <div className="flex items-start gap-3 rounded-xl border border-warn-300/70 dark:border-warn-800/50 bg-warn-50/70 dark:bg-warn-950/20 px-3 py-2.5">
            <HandCoins size={15} className="shrink-0 text-warn-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <Text className="text-sm font-medium leading-tight">I owe someone</Text>
              <Text variant="small" className="text-slate-500 leading-tight">A friend paid for this — track it now; the expense is added when you mark it repaid.</Text>
            </div>
            <Switch checked={oweMode} onChange={setOweMode} label="I owe someone" className="mt-0.5" />
          </div>
        )}

        {oweMode && (
          <Input
            label="Who paid for you?"
            placeholder="Friend's name"
            value={oweName}
            onChange={(e) => setOweName(e.target.value)}
          />
        )}

        {/* Split — collect from friends (expense/transfer only) */}
        {showSplits && (
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-ink-800/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-brand-500" />
                <Text className="text-sm font-medium">Collect from friends</Text>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                leftIcon={<Plus size={11} strokeWidth={2.6} />}
                onClick={() => setSplits((s) => [...s, { name: '', amount: '', note: '' }])}
              >
                Add
              </Button>
            </div>

            {/* Existing debts for this transaction (edit mode) */}
            {editTx && txDebts.length > 0 && (
              <div className="space-y-1.5">
                <Text variant="small" className="text-slate-400 font-medium uppercase tracking-wide text-[10px]">
                  Already tracked
                </Text>
                {txDebts.map((d) => (
                  <div key={d._id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-white/60 dark:bg-ink-900/40 border border-slate-100 dark:border-white/[0.05]">
                    <Text className="flex-1 text-sm truncate">{d.friendName}</Text>
                    <Text className="text-sm tabular-nums font-medium text-slate-600 dark:text-slate-300">
                      {fmt(d.amount, currency)}
                    </Text>
                    {d.status === 'settled' ? (
                      <Badge variant="success" className="gap-0.5 text-[10px] shrink-0">
                        <CheckCircle2 size={9} strokeWidth={2.5} /> Settled
                      </Badge>
                    ) : (
                      <Badge variant="warn" className="gap-0.5 text-[10px] shrink-0">
                        <Clock size={9} strokeWidth={2.5} /> Pending
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* New split inputs */}
            {splits.map((sp, i) => (
              <div key={i} className="space-y-1.5 rounded-lg border border-slate-200/70 dark:border-white/[0.08] bg-white/60 dark:bg-ink-900/30 px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={
                      editTx && txDebts.some(
                        (d) => d.status === 'pending' && d.friendName.toLowerCase() === sp.name.trim().toLowerCase(),
                      )
                        ? `${sp.name} (will add to existing)`
                        : 'Friend\'s name'
                    }
                    value={sp.name}
                    onChange={(e) => setSplits((s) => s.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount"
                    value={sp.amount}
                    onChange={(e) => setSplits((s) => s.map((r, j) => j === i ? { ...r, amount: e.target.value } : r))}
                    className="w-24 sm:w-28"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-1 min-h-0 text-slate-400 hover:text-danger-500 shrink-0"
                    onClick={() => setSplits((s) => s.filter((_, j) => j !== i))}
                  >
                    <X size={14} strokeWidth={2.4} />
                  </Button>
                </div>
                <Input
                  placeholder="What's this for? (e.g. dinner, groceries…)"
                  value={sp.note}
                  onChange={(e) => setSplits((s) => s.map((r, j) => j === i ? { ...r, note: e.target.value } : r))}
                  className="text-sm"
                />
              </div>
            ))}

            {/* Duplicate risk warning for old transactions (no sourceTxId debts yet) */}
            {editTx && txDebts.length === 0 && splits.some((sp) =>
              sp.name.trim() &&
              debtSummary.some((s) => s.friendName.toLowerCase() === sp.name.trim().toLowerCase()),
            ) && (
              <div className="flex items-start gap-1.5 rounded-lg bg-warn-50 dark:bg-warn-900/30 px-2.5 py-2">
                <AlertTriangle size={13} strokeWidth={2.2} className="text-warn-500 shrink-0 mt-0.5" />
                <Text variant="small" className="text-warn-700 dark:text-warn-300">
                  This friend already has pending entries. This transaction pre-dates split tracking, so adding them here creates a new separate entry — not a duplicate of an earlier one.
                </Text>
              </div>
            )}

            {/* Amount overflow warning */}
            {splitOverflow && (
              <div className="flex items-center gap-1.5 rounded-lg bg-danger-50 dark:bg-danger-900/30 px-2.5 py-2">
                <AlertTriangle size={13} strokeWidth={2.2} className="text-danger-500 shrink-0" />
                <Text variant="small" className="text-danger-600 dark:text-danger-400">
                  Splits total ({fmt(projectedTotal, currency)}) exceeds the transaction amount ({fmt(txAmountMinor, currency)}).
                </Text>
              </div>
            )}

            {splits.length > 0 && !splitOverflow && (
              <Text variant="small" className="text-slate-400">
                {editTx
                  ? 'Matching a pending friend\'s name adds to their existing amount.'
                  : 'Entries added here will appear under "People owe you" on the transactions page.'}
              </Text>
            )}
          </div>
        )}

        {/* Instant card toggle — hidden while tracking a debt or editing a card */}
        {!oweMode && !cardMode && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-ink-800/40 px-3 py-2.5">
            <Zap size={15} className="shrink-0 text-brand-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <Text className="text-sm font-medium leading-tight">Save as instant card</Text>
              <Text variant="small" className="text-slate-500 leading-tight">One-tap repeat with today&apos;s date</Text>
            </div>
            <Switch
              checked={saveAsCard}
              onChange={setSaveAsCard}
              label="Save as instant card"
              className="mt-0.5"
            />
          </div>
        )}

      </form>
    </Modal>
  );
}
