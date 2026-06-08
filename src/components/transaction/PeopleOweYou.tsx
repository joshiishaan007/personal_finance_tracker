'use client';

import { useState } from 'react';
import { Users, Check, Trash2, Pencil, X, ChevronDown, ArrowDownLeft, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDebtSummary, useFriendDebts, useSettledDebts, useUpdateDebt, useDeleteDebt,
  type DebtView, type DebtSummaryItem,
} from '@/hooks/useDebts';
import { useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { fmt, fmtDate, cn } from '@/lib/utils';
import { toMinorUnits } from '@/shared';
import type { Currency } from '@/shared';

// ── Friend detail modal ──────────────────────────────────────────────────────

interface FriendModalProps {
  friendName: string | null;
  onClose: () => void;
  initialShowSettled?: boolean;
}

function FriendDebtsModal({ friendName, onClose, initialShowSettled = false }: FriendModalProps) {
  const { user } = useAuth();
  const currency = (user?.currency ?? 'INR') as Currency;
  const { data: debts = [], isLoading } = useFriendDebts(friendName);
  const { data: categories } = useCategories();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();
  const createTx   = useCreateTransaction();
  const deleteTx   = useDeleteTransaction();

  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editAmount,     setEditAmount]     = useState('');
  // Track which entries have had an income tx auto-created for them.
  const [settledIds,     setSettledIds]     = useState<Set<string>>(new Set());
  const [showSettled,    setShowSettled]    = useState(initialShowSettled);
  const [pendingSettle,  setPendingSettle]  = useState<DebtView | null>(null);
  const [pendingRevert,  setPendingRevert]  = useState<DebtView | null>(null);
  const [confirmAll,     setConfirmAll]     = useState(false);

  const { data: settledDebts = [] } = useFriendDebts(showSettled ? friendName : null, 'settled');

  const total = debts.reduce((s, d) => s + d.amount, 0);

  // Search by keyword priority so 'Reimbursement' beats 'Other Income'.
  const incomeList = (categories ?? []).filter((c) => c.type === 'income');
  const PRIORITY_KEYWORDS = ['reimburse', 'friend', 'receive', 'collect', 'misc', 'other'];
  const incomeCat =
    PRIORITY_KEYWORDS.reduce<(typeof incomeList)[number] | undefined>(
      (found, k) => found ?? incomeList.find((c) => c.name.toLowerCase().includes(k)),
      undefined,
    ) ?? incomeList[0];

  function startEdit(d: DebtView) {
    setEditingId(d._id);
    setEditAmount(String(d.amount / 100));
  }

  function saveEdit(id: string) {
    const v = parseFloat(editAmount);
    if (isNaN(v) || v <= 0) { setEditingId(null); return; }
    updateDebt.mutate({ id, data: { amount: toMinorUnits(v, currency) } });
    setEditingId(null);
  }

  async function settle(d: DebtView) {
    await updateDebt.mutateAsync({ id: d._id, data: { status: 'settled' } });
    if (incomeCat) {
      const txId = await createTx.mutateAsync({
        amount:        d.amount,
        type:          'income',
        categoryId:    incomeCat._id,
        date:          new Date().toISOString(),
        note:          `Reimbursement from ${friendName ?? ''}`,
        paymentMethod: 'upi',
        tags:          ['reimbursement'],
        isRecurring:   false,
      });
      // Link the income tx to this debt so it can be deleted on revert.
      await updateDebt.mutateAsync({ id: d._id, data: { transactionId: txId } });
    }
    setSettledIds((prev) => new Set(prev).add(d._id));
  }

  // Settle entries one-by-one to avoid concurrent mutation state collisions.
  async function settleAll() {
    for (const d of [...debts]) {
      await settle(d);
    }
  }

  return (
    <>
    <Modal
      open={!!friendName}
      onClose={onClose}
      title={`${friendName ?? ''} owes you`}
    >
      <div className="space-y-3">
        {/* Total banner */}
        {debts.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-brand-50 dark:bg-brand-950/30 px-4 py-3">
            <Text className="text-sm font-medium text-brand-700 dark:text-brand-300">Total pending</Text>
            <Text className="text-lg font-bold tabular-nums text-brand-700 dark:text-brand-300">
              {fmt(total, currency)}
            </Text>
          </div>
        )}

        {/* Entry list */}
        {isLoading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : debts.length === 0 ? (
          <Text variant="small" className="text-slate-400 text-center py-4">All settled up!</Text>
        ) : (
          <div className="space-y-2">
            {debts.map((d) => (
              <div
                key={d._id}
                className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-ink-800/60 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  {d.note && (
                    <Text className="text-sm font-medium truncate">{d.note}</Text>
                  )}
                  <Text variant="small" className="text-slate-400">{fmtDate(d.createdAt)}</Text>
                </div>

                {editingId === d._id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-24 h-7 text-sm px-2"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(d._id); if (e.key === 'Escape') setEditingId(null); }}
                    />
                    <Button variant="ghost" size="sm" className="p-1 min-h-0 text-success-600" onClick={() => saveEdit(d._id)}>
                      <Check size={13} strokeWidth={2.5} />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1 min-h-0" onClick={() => setEditingId(null)}>
                      <X size={13} strokeWidth={2.5} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-end gap-0.5">
                      <Text className={cn('text-sm font-bold tabular-nums', 'text-brand-600 dark:text-brand-400')}>
                        {fmt(d.amount, currency)}
                      </Text>
                      {/* Shown after settling to confirm the income tx was recorded */}
                      {settledIds.has(d._id) && incomeCat && (
                        <Badge variant="success" className="text-[10px] flex items-center gap-0.5">
                          <ArrowDownLeft size={9} strokeWidth={2.5} /> income recorded
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5 min-h-0 hover:text-slate-700"
                        aria-label="Edit amount"
                        onClick={() => startEdit(d)}
                      >
                        <Pencil size={12} strokeWidth={2.2} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5 min-h-0 hover:text-success-600"
                        aria-label="Mark settled"
                        onClick={() => setPendingSettle(d)}
                        loading={updateDebt.isPending}
                      >
                        <Check size={13} strokeWidth={2.5} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5 min-h-0 hover:text-danger-500"
                        aria-label="Delete"
                        onClick={() => deleteDebt.mutate(d._id)}
                        loading={deleteDebt.isPending}
                      >
                        <Trash2 size={12} strokeWidth={2.2} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {debts.length > 1 && (
          <div className="space-y-1.5">
            <Button variant="gradient" size="sm" className="w-full" leftIcon={<Check size={14} strokeWidth={2.4} />} onClick={() => setConfirmAll(true)}>
              Settle all
            </Button>
            {incomeCat && (
              <Text variant="small" className="text-center text-slate-400">
                Each entry creates an income transaction automatically
              </Text>
            )}
          </div>
        )}

        {/* Settled entries with revert option */}
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
            onClick={() => setShowSettled((v) => !v)}
          >
            {showSettled ? 'Hide settled' : 'Show settled entries'}
          </Button>
          {showSettled && settledDebts.length > 0 && (
            <div className="mt-2 space-y-2">
              {settledDebts.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center gap-2 rounded-xl border border-slate-200/60 dark:border-white/[0.05] bg-slate-50/60 dark:bg-ink-900/40 px-3 py-2.5 opacity-70"
                >
                  <div className="flex-1 min-w-0">
                    {d.note && <Text className="text-sm truncate">{d.note}</Text>}
                    <Text variant="small" className="text-slate-400">{fmtDate(d.createdAt)}</Text>
                  </div>
                  <Text className="text-sm font-bold tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                    {fmt(d.amount, currency)}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1.5 min-h-0 hover:text-warn-500 shrink-0"
                    aria-label="Revert to pending"
                    title="Revert to pending"
                    onClick={() => setPendingRevert(d)}
                    loading={updateDebt.isPending || deleteTx.isPending}
                  >
                    <RotateCcw size={12} strokeWidth={2.2} />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {showSettled && settledDebts.length === 0 && (
            <Text variant="small" className="text-center text-slate-400 py-2">No settled entries</Text>
          )}
        </div>
      </div>
    </Modal>

    <ConfirmDialog
      open={!!pendingSettle}
      onClose={() => setPendingSettle(null)}
      onConfirm={() => { if (pendingSettle) void settle(pendingSettle); }}
      title="Mark as settled?"
      description={pendingSettle ? `This will record a reimbursement income of ${fmt(pendingSettle.amount, currency)} from ${friendName ?? ''}.` : undefined}
      confirmLabel="Mark settled"
      variant="danger"
      loading={updateDebt.isPending || createTx.isPending}
    />

    <ConfirmDialog
      open={confirmAll}
      onClose={() => setConfirmAll(false)}
      onConfirm={() => void settleAll()}
      title="Settle all entries?"
      description={`This will mark all ${debts.length} entries as settled and record income transactions for each.`}
      confirmLabel="Settle all"
      variant="danger"
      loading={updateDebt.isPending || createTx.isPending}
    />

    <ConfirmDialog
      open={!!pendingRevert}
      onClose={() => setPendingRevert(null)}
      onConfirm={() => {
        if (!pendingRevert) return;
        if (pendingRevert.transactionId) void deleteTx.mutateAsync(pendingRevert.transactionId);
        updateDebt.mutate({ id: pendingRevert._id, data: { status: 'pending' } });
      }}
      title="Revert to pending?"
      description={pendingRevert?.transactionId ? 'The linked income transaction will also be deleted.' : 'This entry will be moved back to pending.'}
      confirmLabel="Revert"
      variant="warn"
      loading={updateDebt.isPending || deleteTx.isPending}
    />
    </>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────

export function PeopleOweYou() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { data: summary = [] } = useDebtSummary();
  const { data: allSettled = [] } = useSettledDebts();
  const [selectedFriend, setSelectedFriend]         = useState<string | null>(null);
  const [openSettledFor, setOpenSettledFor]         = useState<string | null>(null);
  const [expanded, setExpanded]                     = useState(true);
  const [settledExpanded, setSettledExpanded]       = useState(false);

  // Group settled debts by friendName for the summary row.
  const settledByFriend = allSettled.reduce<Record<string, { total: number; count: number }>>(
    (acc, d) => {
      const key = d.friendName.toLowerCase();
      const existing = acc[key] ?? { total: 0, count: 0 };
      acc[key] = { total: existing.total + d.amount, count: existing.count + 1 };
      return acc;
    },
    {},
  );
  // Unique friend names with at least one settled entry (preserving display casing).
  const settledFriends = [
    ...new Map(allSettled.map((d) => [d.friendName.toLowerCase(), d.friendName])).values(),
  ];

  if (summary.length === 0 && settledFriends.length === 0) return null;

  const grandTotal = summary.reduce((s, f) => s + f.total, 0);

  return (
    <>
      <Card variant="glass" padding="sm">
        <Button
          type="button"
          variant="ghost"
          className="flex items-center justify-between w-full mb-3 -mx-1 px-1 min-h-0 h-auto"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Users size={15} strokeWidth={2.4} className="text-brand-500" />
            <Text className="text-sm font-semibold">People owe you</Text>
          </div>
          <div className="flex items-center gap-2">
            <Text className="text-sm font-bold tabular-nums text-brand-600 dark:text-brand-400">
              {fmt(grandTotal, currency)}
            </Text>
            <ChevronDown
              size={14}
              strokeWidth={2.4}
              className={cn('text-slate-400 transition-transform', expanded && 'rotate-180')}
            />
          </div>
        </Button>

        {expanded && (
          <div className="space-y-1.5">
            {summary.map((f: DebtSummaryItem) => (
              <div
                key={f.friendName}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50/80 dark:hover:bg-ink-800/50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0">
                  <Text as="span" className="text-xs font-bold text-brand-700 dark:text-brand-300 uppercase">
                    {f.friendName.charAt(0)}
                  </Text>
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="text-sm font-medium truncate">{f.friendName}</Text>
                  <Text variant="small" className="text-slate-400">{f.count} {f.count === 1 ? 'entry' : 'entries'}</Text>
                </div>
                <Text as="span" className="text-sm font-bold tabular-nums text-brand-600 dark:text-brand-400 shrink-0">
                  {fmt(f.total, currency)}
                </Text>
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0 px-2.5 text-xs"
                  onClick={() => setSelectedFriend(f.friendName)}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Settled friends section */}
      {settledFriends.length > 0 && (
        <Card variant="glass" padding="sm">
          <Button
            type="button"
            variant="ghost"
            className="flex items-center justify-between w-full -mx-1 px-1 min-h-0 h-auto"
            onClick={() => setSettledExpanded((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Check size={14} strokeWidth={2.4} className="text-success-500" />
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Settled</Text>
            </div>
            <ChevronDown
              size={14}
              strokeWidth={2.4}
              className={cn('text-slate-400 transition-transform', settledExpanded && 'rotate-180')}
            />
          </Button>
          {settledExpanded && (
            <div className="space-y-1.5 mt-3">
              {settledFriends.map((name) => {
                const key = name.toLowerCase();
                const info = settledByFriend[key] ?? { total: 0, count: 0 };
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50/80 dark:hover:bg-ink-800/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-ink-700 flex items-center justify-center shrink-0">
                      <Text as="span" className="text-xs font-bold text-slate-500 uppercase">
                        {name.charAt(0)}
                      </Text>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text className="text-sm font-medium truncate text-slate-500">{name}</Text>
                      <Text variant="small" className="text-slate-400">{info.count} settled</Text>
                    </div>
                    <Text as="span" className="text-sm tabular-nums text-slate-400 line-through shrink-0">
                      {fmt(info.total, currency)}
                    </Text>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shrink-0 px-2.5 text-xs"
                      onClick={() => setOpenSettledFor(name)}
                    >
                      Revert
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <FriendDebtsModal
        friendName={selectedFriend}
        onClose={() => setSelectedFriend(null)}
      />

      {/* Modal opened from the settled section — pre-opens settled entries */}
      <FriendDebtsModal
        friendName={openSettledFor}
        onClose={() => setOpenSettledFor(null)}
        initialShowSettled
      />
    </>
  );
}
