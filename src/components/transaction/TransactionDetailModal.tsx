'use client';

import { useState } from 'react';
import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, TrendingUp, Undo2, Tag, Users } from 'lucide-react';
import { fmt, fmtDate, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestments } from '@/hooks/useInvestments';
import { useCategories } from '@/hooks/useCategories';
import { useDeleteTransaction, type Transaction } from '@/hooks/useTransactions';
import { useTransactionDebts } from '@/hooks/useDebts';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Props {
  open:    boolean;
  onClose: () => void;
  tx:      Transaction | null;
  onEdit:  (tx: Transaction) => void;
}

const TYPE_META = {
  income:     { icon: ArrowDownLeft, label: 'Income',     color: 'text-success-600 dark:text-success-400',  bg: 'bg-success-50 dark:bg-success-950/40',  sign: '+' },
  expense:    { icon: ArrowUpRight,  label: 'Expense',    color: 'text-danger-600 dark:text-danger-400',    bg: 'bg-danger-50 dark:bg-danger-950/40',    sign: '-' },
  transfer:   { icon: ArrowLeftRight,label: 'Transfer',   color: 'text-slate-700 dark:text-slate-200',      bg: 'bg-slate-100 dark:bg-ink-800',           sign: ''  },
  investment: { icon: TrendingUp,    label: 'Investment', color: 'text-brand-600 dark:text-brand-400',      bg: 'bg-brand-50 dark:bg-brand-950/40',       sign: ''  },
  reimbursement: { icon: Undo2,      label: 'Reimbursement', color: 'text-aqua-600 dark:text-aqua-400',   bg: 'bg-aqua-50 dark:bg-aqua-950/40',         sign: '+' },
};

const PM_LABELS: Record<string, string> = {
  cash: 'Cash', card: 'Card', upi: 'UPI', netbanking: 'Net Banking',
  wallet: 'Wallet', cheque: 'Cheque', other: 'Other',
};

export function TransactionDetailModal({ open, onClose, tx, onEdit }: Props) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { data: categories } = useCategories();
  const { data: investments } = useInvestments();
  const deleteTx = useDeleteTransaction();
  const { data: txDebts = [] } = useTransactionDebts(tx?._id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!tx) return null;
  // Capture into a const so TypeScript narrows correctly inside closures.
  const t = tx;

  const catMap  = Object.fromEntries((categories ?? []).map((c) => [c._id, c]));
  const invMap  = Object.fromEntries((investments ?? []).map((i) => [i._id, i]));
  const cat     = catMap[t.categoryId];
  const inv     = t.investmentId ? invMap[t.investmentId] : null;
  const meta    = TYPE_META[t.type as keyof typeof TYPE_META] ?? TYPE_META.expense;
  const Icon    = meta.icon;

  return (
    <>
      <Modal open={open} onClose={onClose} title="Transaction details" placement="center" className="max-w-md">
        <div className="space-y-4">
          {/* Type + date header */}
          <div className="flex items-center justify-between">
            <span className={cn('inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-1 rounded-full', meta.bg, meta.color)}>
              <Icon size={14} strokeWidth={2.4} />
              {meta.label}
            </span>
            <Text variant="small" className="text-slate-500">{fmtDate(t.date)}</Text>
          </div>

          {/* Amount — hero */}
          <div className={cn('text-3xl font-bold tabular-nums tracking-tight', meta.color)}>
            {meta.sign}{fmt(t.amount, currency)}
          </div>

          {/* Details grid */}
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {/* Actual money-used date (debt settlements) — distinct from the cash date above */}
            {t.incurredAt && fmtDate(t.incurredAt) !== fmtDate(t.date) && (
              <div className="flex items-center justify-between py-2.5">
                <Text variant="small" className="text-slate-500">Money used on</Text>
                <Text className="text-sm font-medium">{fmtDate(t.incurredAt)}</Text>
              </div>
            )}

            {/* Category */}
            <div className="flex items-center justify-between py-2.5">
              <Text variant="small" className="text-slate-500">Category</Text>
              <Text className="text-sm font-medium">
                {cat ? `${cat.icon} ${cat.name}` : '—'}
              </Text>
            </div>

            {/* Payment method */}
            <div className="flex items-center justify-between py-2.5">
              <Text variant="small" className="text-slate-500">Payment</Text>
              <Text className="text-sm font-medium">{PM_LABELS[t.paymentMethod] ?? t.paymentMethod}</Text>
            </div>

            {/* Note */}
            {t.note && (
              <div className="flex items-start justify-between gap-3 py-2.5">
                <Text variant="small" className="text-slate-500 shrink-0">Note</Text>
                <Text className="text-sm text-right">{t.note}</Text>
              </div>
            )}

            {/* Linked investment */}
            {inv && (
              <div className="flex items-center justify-between py-2.5">
                <Text variant="small" className="text-slate-500">Investment</Text>
                <Text className="text-sm font-medium">{inv.icon} {inv.name}</Text>
              </div>
            )}
          </div>

          {/* Tags */}
          {t.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag size={12} className="text-slate-400" />
              {t.tags.map((tag) => (
                <Badge key={tag} variant="default" className="text-[11px]">{tag}</Badge>
              ))}
            </div>
          )}

          {/* People owe you — debts linked to this transaction */}
          {txDebts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Users size={13} strokeWidth={2.2} className="text-brand-500" />
                <Text variant="small" className="font-semibold uppercase tracking-wide text-[11px] text-slate-500">
                  People owe you
                </Text>
              </div>
              <div className="space-y-1">
                {txDebts.map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-ink-800/60 border border-slate-100 dark:border-white/[0.05]"
                  >
                    <div className="min-w-0 flex-1">
                      <Text className="text-sm font-medium truncate">{d.friendName}</Text>
                      {d.note && (
                        <Text variant="small" className="text-slate-400 truncate">{d.note}</Text>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Text as="span" className="text-sm font-bold tabular-nums text-brand-600 dark:text-brand-400">
                        {fmt(d.amount, currency)}
                      </Text>
                      <Badge
                        variant={d.status === 'settled' ? 'success' : 'warn'}
                        className="text-[10px]"
                      >
                        {d.status === 'settled' ? 'Settled' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              leftIcon={<Pencil size={14} strokeWidth={2.2} />}
              onClick={() => { onClose(); onEdit(t); }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/30"
              leftIcon={<Trash2 size={14} strokeWidth={2.2} />}
              loading={deleteTx.isPending}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteTx.mutate(t._id, { onSuccess: onClose })}
        title="Delete transaction?"
        description="This transaction will be permanently removed from your records."
        loading={deleteTx.isPending}
      />
    </>
  );
}
