'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Check, Trash2, Pencil, X, ChevronDown, ArrowDownLeft, ArrowUpRight, RotateCcw, Eye,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDebtSummary, useInfiniteFriendDebts, useSettledDebts, useUpdateDebt, useDeleteDebt,
  useCleanupSettledDebts, type DebtView, type DebtSummaryItem, type DebtDirection,
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
import type { Currency, CreateTransaction } from '@/shared';

// ── Direction config ───────────────────────────────────────────────────────
// One generic tracker drives both "People owe you" (lending) and "You owe others"
// (borrowing). The two differ only in accent tone, copy, and whether settling
// records an income or an expense.

export interface DebtTrackerConfig {
  direction:         DebtDirection;
  tone:              'brand' | 'warn';
  title:             string;
  icon:              LucideIcon;
  emptyText:         string;
  settleTxType:      'income' | 'expense';
  // Action copy — kept per-direction so "People owe you" keeps its original wording.
  markLabel:         string; // "Mark settled" / "Mark done"
  markQuestion:      string; // "Mark as settled?" / "Mark as done?"
  markAllLabel:      string; // "Settle all" / "Mark all done"
  markAllQuestion:   string; // "Settle all entries?" / "Mark all done?"
  modalTitle:        (name: string) => string;
  settleDescription: (amount: string, name: string) => string;
  deleteDescription: (amount: string, name: string) => string;
}

interface ToneClasses {
  bannerBg: string; bannerText: string; amount: string;
  avatarBg: string; avatarText: string; icon: string;
  viewHover: string; spinnerBorder: string;
}

const TONES: Record<'brand' | 'warn', ToneClasses> = {
  brand: {
    bannerBg:      'bg-brand-50 dark:bg-brand-950/30',
    bannerText:    'text-brand-700 dark:text-brand-300',
    amount:        'text-brand-600 dark:text-brand-400',
    avatarBg:      'bg-brand-100 dark:bg-brand-900/50',
    avatarText:    'text-brand-700 dark:text-brand-300',
    icon:          'text-brand-500',
    viewHover:     'hover:text-brand-500',
    spinnerBorder: 'border-brand-400',
  },
  warn: {
    bannerBg:      'bg-warn-50 dark:bg-warn-950/30',
    bannerText:    'text-warn-700 dark:text-warn-300',
    amount:        'text-warn-600 dark:text-warn-400',
    avatarBg:      'bg-warn-100 dark:bg-warn-900/50',
    avatarText:    'text-warn-700 dark:text-warn-300',
    icon:          'text-warn-500',
    viewHover:     'hover:text-warn-500',
    spinnerBorder: 'border-warn-400',
  },
};

// Income category for lending reimbursements: keyword priority so 'Reimbursement'
// beats 'Other Income'. Expense fallback for borrowing repayments when the entry
// has no captured category (legacy rows).
const INCOME_KEYWORDS  = ['reimburse', 'friend', 'receive', 'collect', 'misc', 'other'];
const EXPENSE_KEYWORDS = ['misc', 'other', 'general', 'friend'];

// ── Friend detail modal ──────────────────────────────────────────────────────

interface FriendModalProps {
  config:             DebtTrackerConfig;
  friendName:         string | null;
  onClose:            () => void;
  initialShowSettled?: boolean;
}

function FriendDebtsModal({ config, friendName, onClose, initialShowSettled = false }: FriendModalProps) {
  const { user } = useAuth();
  const currency = (user?.currency ?? 'INR') as Currency;
  const { data: categories } = useCategories();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();
  const createTx   = useCreateTransaction();
  const deleteTx   = useDeleteTransaction();

  const tone = TONES[config.tone];
  const noun = config.settleTxType; // 'income' | 'expense'
  const SettleIcon = noun === 'income' ? ArrowDownLeft : ArrowUpRight;

  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editAmount,     setEditAmount]     = useState('');
  const [editNote,       setEditNote]       = useState('');
  const [settledIds,     setSettledIds]     = useState<Set<string>>(new Set());
  // Per-entry settle loading — shared mutation.isPending would light up all rows at once.
  const [settlingIds,    setSettlingIds]    = useState<Set<string>>(new Set());
  const [showSettled,    setShowSettled]    = useState(initialShowSettled);
  const [pendingSettle,  setPendingSettle]  = useState<DebtView | null>(null);
  const [pendingRevert,  setPendingRevert]  = useState<DebtView | null>(null);
  const [pendingDelete,  setPendingDelete]  = useState<DebtView | null>(null);
  const [confirmAll,     setConfirmAll]     = useState(false);

  // Pending — infinite scroll
  const {
    data: pendingPages,
    isLoading,
    hasNextPage: hasMorePending,
    fetchNextPage: fetchMorePending,
    isFetchingNextPage: isFetchingMorePending,
  } = useInfiniteFriendDebts(friendName, 'pending', config.direction);
  const debts = pendingPages?.pages.flatMap((p) => p.items) ?? [];
  const pendingTotal = pendingPages?.pages[0]?.total ?? 0;

  // Settled — infinite scroll (loaded on demand)
  const {
    data: settledPages,
    hasNextPage: hasMoreSettled,
    fetchNextPage: fetchMoreSettled,
    isFetchingNextPage: isFetchingMoreSettled,
  } = useInfiniteFriendDebts(showSettled ? friendName : null, 'settled', config.direction);
  const settledDebts = settledPages?.pages.flatMap((p) => p.items) ?? [];
  const settledTotal = settledPages?.pages[0]?.total ?? 0;

  const pendingSentinelRef = useRef<HTMLDivElement>(null);
  const settledSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pendingSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMorePending && !isFetchingMorePending) void fetchMorePending();
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchMorePending, hasMorePending, isFetchingMorePending]);

  useEffect(() => {
    const el = settledSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMoreSettled && !isFetchingMoreSettled) void fetchMoreSettled();
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchMoreSettled, hasMoreSettled, isFetchingMoreSettled]);

  const pendingNeedsScroll = pendingTotal > 5;
  const settledNeedsScroll = settledTotal > 5;

  const total = debts.reduce((s, d) => s + d.amount, 0);

  const incomeList  = (categories ?? []).filter((c) => c.type === 'income');
  const expenseList = (categories ?? []).filter((c) => c.type === 'expense');
  const pickByKeyword = (list: typeof incomeList, keywords: string[]) =>
    keywords.reduce<(typeof list)[number] | undefined>(
      (found, k) => found ?? list.find((c) => c.name.toLowerCase().includes(k)),
      undefined,
    ) ?? list[0];
  const incomeCat  = pickByKeyword(incomeList, INCOME_KEYWORDS);
  const expenseCat = pickByKeyword(expenseList, EXPENSE_KEYWORDS);

  // Resolve the category the settlement transaction should use.
  function settleCategoryId(d: DebtView): string | undefined {
    if (noun === 'income') return incomeCat?._id;
    return d.categoryId ?? expenseCat?._id;
  }

  function buildSettlementTx(d: DebtView, categoryId: string): CreateTransaction {
    const base = {
      amount:      d.amount,
      categoryId,
      date:        new Date().toISOString(),
      // Carry the actual money-used date through to the settlement transaction.
      incurredAt:  d.incurredAt,
      isRecurring: false as const,
    };
    if (noun === 'income') {
      return {
        ...base,
        type:          'income',
        note:          `Reimbursement from ${friendName ?? ''}`,
        paymentMethod: 'upi',
        tags:          ['reimbursement'],
      };
    }
    return {
      ...base,
      type:          'expense',
      note:          d.note ?? `Repaid ${friendName ?? ''}`,
      paymentMethod: (d.paymentMethod ?? 'upi') as CreateTransaction['paymentMethod'],
      tags:          ['repayment'],
    };
  }

  function startEdit(d: DebtView) {
    setEditingId(d._id);
    setEditAmount(String(d.amount / 100));
    setEditNote(d.note ?? '');
  }

  function saveEdit(id: string) {
    const v = parseFloat(editAmount);
    if (isNaN(v) || v <= 0) { setEditingId(null); return; }
    updateDebt.mutate({ id, data: { amount: toMinorUnits(v, currency), note: editNote.trim() || undefined } });
    setEditingId(null);
  }

  async function settle(d: DebtView) {
    setSettlingIds((prev) => new Set(prev).add(d._id));
    try {
      await updateDebt.mutateAsync({ id: d._id, data: { status: 'settled' } });
      const categoryId = settleCategoryId(d);
      if (categoryId) {
        const txId = await createTx.mutateAsync(buildSettlementTx(d, categoryId));
        // Link the settlement tx to this debt so it can be deleted on revert.
        await updateDebt.mutateAsync({ id: d._id, data: { transactionId: txId } });
      }
      setSettledIds((prev) => new Set(prev).add(d._id));
    } finally {
      setSettlingIds((prev) => { const next = new Set(prev); next.delete(d._id); return next; });
    }
  }

  // Settle entries one-by-one to avoid concurrent mutation state collisions.
  async function settleAll() {
    for (const d of [...debts]) {
      await settle(d);
    }
  }

  const hasSettleCategory = noun === 'income' ? !!incomeCat : (!!expenseCat || debts.some((d) => d.categoryId));

  return (
    <>
    <Modal
      open={!!friendName}
      onClose={onClose}
      title={config.modalTitle(friendName ?? '')}
      placement="center"
      className="max-w-md"
    >
      <div className="space-y-3">
        {/* Total banner */}
        {debts.length > 0 && (
          <div className={cn('flex items-center justify-between rounded-xl px-4 py-3', tone.bannerBg)}>
            <Text className={cn('text-sm font-medium', tone.bannerText)}>Total pending</Text>
            <Text className={cn('text-lg font-bold tabular-nums', tone.bannerText)}>
              {fmt(total, currency)}
            </Text>
          </div>
        )}

        {/* Entry list */}
        {isLoading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : debts.length === 0 ? (
          <Text variant="small" className="text-slate-400 text-center py-4">{config.emptyText}</Text>
        ) : (
          <div className={cn('space-y-2', pendingNeedsScroll && 'max-h-[300px] overflow-y-auto pr-0.5')}>
            {debts.map((d) => (
              <div
                key={d._id}
                className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-ink-800/60 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  {d.note && (
                    <Text className="text-sm font-medium truncate">{d.note}</Text>
                  )}
                  <Text variant="small" className="text-slate-400">
                    {fmtDate(d.incurredAt ?? d.createdAt)}
                  </Text>
                </div>

                {editingId === d._id ? (
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-28 h-7 text-sm px-2"
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
                    <Input
                      placeholder="Add a note (e.g. dinner, groceries…)"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="h-7 text-sm px-2 w-full"
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(d._id); if (e.key === 'Escape') setEditingId(null); }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-end gap-0.5">
                      <Text className={cn('text-sm font-bold tabular-nums', tone.amount)}>
                        {fmt(d.amount, currency)}
                      </Text>
                      {/* Shown after settling to confirm the tx was recorded */}
                      {settledIds.has(d._id) && (
                        <Badge variant={noun === 'income' ? 'success' : 'warn'} className="text-[10px] flex items-center gap-0.5">
                          <SettleIcon size={9} strokeWidth={2.5} /> {noun} recorded
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
                        aria-label={config.markLabel}
                        onClick={() => setPendingSettle(d)}
                        loading={settlingIds.has(d._id)}
                      >
                        <Check size={13} strokeWidth={2.5} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1.5 min-h-0 hover:text-danger-500"
                        aria-label="Delete"
                        onClick={() => setPendingDelete(d)}
                        loading={deleteDebt.isPending}
                      >
                        <Trash2 size={12} strokeWidth={2.2} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            <div ref={pendingSentinelRef} className="h-1" />
            {isFetchingMorePending && (
              <div className="py-1 text-center">
                <span className={cn('inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin', tone.spinnerBorder)} />
              </div>
            )}
          </div>
        )}

        {debts.length > 1 && (
          <div className="space-y-1.5">
            <Button variant="gradient" size="sm" className="w-full" leftIcon={<Check size={14} strokeWidth={2.4} />} onClick={() => setConfirmAll(true)}>
              {config.markAllLabel}
            </Button>
            {hasSettleCategory && (
              <Text variant="small" className="text-center text-slate-400">
                Each entry creates an {noun} transaction automatically
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
            <div className={cn('mt-2 space-y-2', settledNeedsScroll && 'max-h-[300px] overflow-y-auto pr-0.5')}>
              {settledDebts.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center gap-2 rounded-xl border border-slate-200/60 dark:border-white/[0.05] bg-slate-50/60 dark:bg-ink-900/40 px-3 py-2.5 opacity-70"
                >
                  <div className="flex-1 min-w-0">
                    {d.note && <Text className="text-sm truncate">{d.note}</Text>}
                    <Text variant="small" className="text-slate-400">{fmtDate(d.incurredAt ?? d.createdAt)}</Text>
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
              <div ref={settledSentinelRef} className="h-1" />
              {isFetchingMoreSettled && (
                <div className="py-1 text-center">
                  <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
          {showSettled && settledDebts.length === 0 && (
            <Text variant="small" className="text-center text-slate-400 py-2">No settled entries</Text>
          )}
        </div>
      </div>
    </Modal>

    <ConfirmDialog
      open={!!pendingDelete}
      onClose={() => setPendingDelete(null)}
      onConfirm={() => deleteDebt.mutate(pendingDelete!._id)}
      title="Remove this entry?"
      description={pendingDelete ? config.deleteDescription(fmt(pendingDelete.amount, currency), pendingDelete.friendName) : undefined}
      loading={deleteDebt.isPending}
    />

    <ConfirmDialog
      open={!!pendingSettle}
      onClose={() => setPendingSettle(null)}
      onConfirm={() => {
        if (pendingSettle) {
          void settle(pendingSettle);
          setPendingSettle(null); // close immediately; per-entry spinner tracks progress
        }
      }}
      title={config.markQuestion}
      description={pendingSettle ? config.settleDescription(fmt(pendingSettle.amount, currency), friendName ?? '') : undefined}
      confirmLabel={config.markLabel}
      variant="danger"
      loading={pendingSettle ? settlingIds.has(pendingSettle._id) : false}
    />

    <ConfirmDialog
      open={confirmAll}
      onClose={() => setConfirmAll(false)}
      onConfirm={() => void settleAll()}
      title={config.markAllQuestion}
      description={`This will mark all ${debts.length} entries as ${noun === 'income' ? 'settled' : 'done'} and record ${noun} transactions for each.`}
      confirmLabel={config.markAllLabel}
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
        setSettledIds((prev) => { const next = new Set(prev); next.delete(pendingRevert._id); return next; });
      }}
      title="Revert to pending?"
      description={pendingRevert?.transactionId ? `The linked ${noun} transaction will also be deleted.` : 'This entry will be moved back to pending.'}
      confirmLabel="Revert"
      variant="warn"
      loading={updateDebt.isPending || deleteTx.isPending}
    />
    </>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────

export function DebtTracker({ config }: { config: DebtTrackerConfig }) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const tone = TONES[config.tone];
  const { data: summary = [] } = useDebtSummary(config.direction);
  const { data: allSettled = [] } = useSettledDebts(config.direction);
  const [selectedFriend, setSelectedFriend]   = useState<string | null>(null);
  const [openSettledFor, setOpenSettledFor]   = useState<string | null>(null);
  const [expanded, setExpanded]               = useState(true);
  const [settledExpanded, setSettledExpanded] = useState(false);
  const [confirmCleanup, setConfirmCleanup]   = useState(false);
  const cleanup = useCleanupSettledDebts();
  const Icon = config.icon;

  const settledByFriend = allSettled.reduce<Record<string, { total: number; count: number }>>(
    (acc, d) => {
      const key = d.friendName.toLowerCase();
      const existing = acc[key] ?? { total: 0, count: 0 };
      acc[key] = { total: existing.total + d.amount, count: existing.count + 1 };
      return acc;
    },
    {},
  );
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
            <Icon size={15} strokeWidth={2.4} className={tone.icon} />
            <Text className="text-sm font-semibold">{config.title}</Text>
          </div>
          <div className="flex items-center gap-2">
            <Text className={cn('text-sm font-bold tabular-nums', tone.amount)}>
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
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', tone.avatarBg)}>
                  <Text as="span" className={cn('text-xs font-bold uppercase', tone.avatarText)}>
                    {f.friendName.charAt(0)}
                  </Text>
                </div>
                <div className="flex-1 min-w-0">
                  <Text className="text-sm font-medium truncate">{f.friendName}</Text>
                  <Text variant="small" className="text-slate-400">{f.count} {f.count === 1 ? 'entry' : 'entries'}</Text>
                </div>
                <Text as="span" className={cn('text-sm font-bold tabular-nums shrink-0', tone.amount)}>
                  {fmt(f.total, currency)}
                </Text>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn('shrink-0 p-1.5 min-h-0 text-slate-400', tone.viewHover)}
                  aria-label={`View ${f.friendName}'s entries`}
                  onClick={() => setSelectedFriend(f.friendName)}
                >
                  <Eye size={15} strokeWidth={2.2} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Settled friends section */}
      {settledFriends.length > 0 && (
        <Card variant="glass" padding="sm">
          <div className="flex items-center -mx-1 px-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 flex items-center justify-between min-h-0 h-auto"
              onClick={() => setSettledExpanded((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Check size={14} strokeWidth={2.4} className="text-success-500" />
                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Settled</Text>
              </div>
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                className={cn('text-slate-400 transition-transform mr-2', settledExpanded && 'rotate-180')}
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="p-1.5 min-h-0 shrink-0 text-slate-400 hover:text-danger-500"
              aria-label="Delete settled entries older than 7 days"
              title="Clean up entries older than 7 days"
              onClick={() => setConfirmCleanup(true)}
              loading={cleanup.isPending}
            >
              <Trash2 size={13} strokeWidth={2.2} />
            </Button>
          </div>
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
        config={config}
        friendName={selectedFriend}
        onClose={() => setSelectedFriend(null)}
      />

      <FriendDebtsModal
        config={config}
        friendName={openSettledFor}
        onClose={() => setOpenSettledFor(null)}
        initialShowSettled
      />

      <ConfirmDialog
        open={confirmCleanup}
        onClose={() => setConfirmCleanup(false)}
        onConfirm={() => cleanup.mutate(undefined, { onSuccess: () => setConfirmCleanup(false) })}
        title="Clean up old settled entries?"
        description="All settled entries older than 7 days will be permanently deleted. This frees up storage and cannot be undone."
        confirmLabel="Clean up"
        variant="danger"
        loading={cleanup.isPending}
      />
    </>
  );
}
