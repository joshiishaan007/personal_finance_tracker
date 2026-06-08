'use client';

import { useState } from 'react';
import { Users, Check, Trash2, Pencil, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDebtSummary, useFriendDebts, useUpdateDebt, useDeleteDebt,
  type DebtView, type DebtSummaryItem,
} from '@/hooks/useDebts';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Heading } from '@/components/ui/Heading';
import { Input } from '@/components/ui/Input';
import { fmt, fmtDate, cn } from '@/lib/utils';
import { toMinorUnits } from '@/shared';
import type { Currency } from '@/shared';

// ── Friend detail modal ──────────────────────────────────────────────────────

interface FriendModalProps {
  friendName: string | null;
  onClose: () => void;
}

function FriendDebtsModal({ friendName, onClose }: FriendModalProps) {
  const { user } = useAuth();
  const currency = (user?.currency ?? 'INR') as Currency;
  const { data: debts = [], isLoading } = useFriendDebts(friendName);
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const total = debts.reduce((s, d) => s + d.amount, 0);

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

  function settle(id: string) {
    updateDebt.mutate({ id, data: { status: 'settled' } });
  }

  function settleAll() {
    for (const d of debts) settle(d._id);
  }

  return (
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
                    <Text className={cn('text-sm font-bold tabular-nums', 'text-brand-600 dark:text-brand-400')}>
                      {fmt(d.amount, currency)}
                    </Text>
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
                        onClick={() => settle(d._id)}
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
          <Button variant="gradient" size="sm" className="w-full" leftIcon={<Check size={14} strokeWidth={2.4} />} onClick={settleAll}>
            Settle all
          </Button>
        )}
      </div>
    </Modal>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────

export function PeopleOweYou() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { data: summary = [] } = useDebtSummary();
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  if (summary.length === 0) return null;

  const grandTotal = summary.reduce((s, f) => s + f.total, 0);

  return (
    <>
      <Card variant="glass" padding="sm">
        <button
          type="button"
          className="flex items-center justify-between w-full mb-3"
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
        </button>

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

      <FriendDebtsModal
        friendName={selectedFriend}
        onClose={() => setSelectedFriend(null)}
      />
    </>
  );
}
