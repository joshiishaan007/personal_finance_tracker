'use client';

import { useState } from 'react';
import { RotateCcw, Trash2, Clock, History } from 'lucide-react';
import { fmt, fmtDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTrash, useRestoreTransaction, usePurgeTransaction, useEmptyTrash, daysLeft, type TrashTransaction } from '@/hooks/useTrash';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TrashView({ open, onClose }: Props) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { data: items, isLoading } = useTrash();
  const { data: categories } = useCategories();
  const restore = useRestoreTransaction();
  const purge = usePurgeTransaction();
  const empty = useEmptyTrash();

  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const catName = (id: string) => categories?.find((c) => c._id === id)?.name ?? 'Uncategorised';

  const list = items ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recently deleted"
      placement="center"
      footer={
        list.length > 0 ? (
          <div className="flex w-full items-center justify-between gap-3">
            <Text variant="small" className="text-slate-500">Auto-deleted 30 days after removal</Text>
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} strokeWidth={2.2} />} loading={empty.isPending} onClick={() => setConfirmEmpty(true)}>
              Empty trash
            </Button>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <SkeletonLoader rows={3} />
      ) : list.length === 0 ? (
        <EmptyState icon={History} title="Nothing here" description="Deleted transactions appear here for 30 days, then auto-delete." />
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto -mx-1 px-1">
          {list.map((tx) => (
            <TrashRow
              key={tx._id}
              tx={tx}
              currency={currency}
              category={catName(tx.categoryId)}
              onRestore={() => restore.mutate(tx._id)}
              onPurge={() => purge.mutate(tx._id)}
              busy={restore.isPending || purge.isPending}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        onConfirm={() => empty.mutate()}
        title="Empty trash?"
        description={`Permanently delete all ${list.length} item${list.length === 1 ? '' : 's'}. This cannot be undone.`}
        confirmLabel="Empty trash"
        variant="danger"
        loading={empty.isPending}
      />
    </Modal>
  );
}

interface RowProps {
  tx: TrashTransaction;
  currency: string;
  category: string;
  onRestore: () => void;
  onPurge: () => void;
  busy: boolean;
}

function TrashRow({ tx, currency, category, onRestore, onPurge, busy }: RowProps) {
  const left = daysLeft(tx.deletedAt);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-ink-800/60 p-3">
      <div className="min-w-0 flex-1">
        <Text className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
          {tx.note || category}
        </Text>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Text as="span" variant="small" className="tabular-nums text-slate-500">
            {fmt(tx.amount, currency)} · {fmtDate(tx.date)}
          </Text>
          <Badge variant={left <= 3 ? 'warn' : 'default'} className="gap-1 text-[10px]">
            <Clock size={10} strokeWidth={2.4} /> {left}d left
          </Badge>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="sm" className="px-2" aria-label="Restore" disabled={busy} onClick={onRestore}>
          <RotateCcw size={15} strokeWidth={2.2} />
        </Button>
        <Button variant="ghost" size="sm" className="px-2 hover:text-danger-500" aria-label="Delete forever" disabled={busy} onClick={onPurge}>
          <Trash2 size={15} strokeWidth={2.2} />
        </Button>
      </div>
    </div>
  );
}
