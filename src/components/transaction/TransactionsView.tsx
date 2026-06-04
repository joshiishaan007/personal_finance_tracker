'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, Plus, Pencil, Trash2, Receipt,
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { fmt, fmtDate, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions, useDeleteTransaction, type Transaction } from '@/hooks/useTransactions';
import { useCategories, type Category } from '@/hooks/useCategories';
import type { TransactionFilter } from '@/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { IconBadge } from '@/components/ui/IconBadge';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { QuickAddBar } from '@/components/transaction/QuickAddBar';
import { QuickAddChips } from '@/components/transaction/QuickAddChips';

type TxType = 'income' | 'expense' | 'transfer' | 'investment';
type Tone = 'success' | 'danger' | 'aqua' | 'brand';

const TYPE_PILLS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'investment', label: 'Investment' },
];

const TYPE_META: Record<TxType, { icon: LucideIcon; tone: Tone }> = {
  income: { icon: ArrowDownLeft, tone: 'success' },
  expense: { icon: ArrowUpRight, tone: 'danger' },
  transfer: { icon: ArrowLeftRight, tone: 'aqua' },
  investment: { icon: TrendingUp, tone: 'brand' },
};

function amountClass(type: string): string {
  if (type === 'income') return 'text-success-600 dark:text-success-400';
  if (type === 'expense') return 'text-danger-600 dark:text-danger-400';
  return 'text-slate-700 dark:text-slate-200';
}

function amountSign(type: string): string {
  if (type === 'income') return '+';
  if (type === 'expense') return '-';
  return '';
}

export function TransactionsView() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({ type: '', search: '', page: 1 });

  // The shell FAB links to /transactions?new=1 — open the add modal, then strip
  // the param so a refresh (or back nav) doesn't reopen it.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditTx(null);
      setFormOpen(true);
      router.replace('/transactions');
    }
  }, [searchParams, router]);

  function closeForm() {
    setFormOpen(false);
    setEditTx(null);
  }

  const query: Partial<TransactionFilter> = {
    page: filters.page,
    limit: 50,
    ...(filters.type ? { type: filters.type as TransactionFilter['type'] } : {}),
    ...(filters.search ? { search: filters.search } : {}),
  };
  const { data, isLoading } = useTransactions(query);
  const { data: categories } = useCategories();
  const deleteTx = useDeleteTransaction();

  const currency = user?.currency ?? 'INR';
  const catMap = Object.fromEntries((categories ?? []).map((c) => [c._id, c])) as Record<string, Category>;

  const items = data?.items ?? [];

  // Group by date (server-paginated page only — no client filter/sort/slice).
  const grouped: Record<string, Transaction[]> = {};
  for (const tx of items) {
    const key = fmtDate(tx.date, 'yyyy-MM-dd');
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(tx);
  }

  const netInView = items.reduce(
    (s, tx) => (tx.type === 'income' ? s + tx.amount : tx.type === 'expense' ? s - tx.amount : s),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading level={1} className="text-2xl">Transactions</Heading>
          <Text variant="small" className="mt-0.5">Every rupee, grouped by day</Text>
        </div>
        <Button
          size="sm"
          variant="gradient"
          leftIcon={<Plus size={16} strokeWidth={2.4} />}
          onClick={() => { setEditTx(null); setFormOpen(true); }}
        >
          New
        </Button>
      </div>

      <div className="space-y-3">
        <QuickAddBar />
        <QuickAddChips />
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="In view"
            value={items.length}
            format={(n) => String(Math.round(n))}
            icon={Receipt}
            tone="brand"
          />
          <StatCard
            label="Net in view"
            value={Math.abs(netInView)}
            format={(n) => `${netInView < 0 ? '-' : ''}${fmt(Math.round(n), currency)}`}
            icon={netInView >= 0 ? ArrowDownLeft : ArrowUpRight}
            tone={netInView >= 0 ? 'success' : 'danger'}
          />
        </div>
      )}

      {/* Sticky glass filter/search bar */}
      <div className="sticky top-2 z-10 -mx-1 px-1">
        <Card variant="glass" padding="sm" className="space-y-3">
          <div className="relative">
            <Search
              size={16}
              strokeWidth={2.2}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              placeholder="Search notes, tags…"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {TYPE_PILLS.map((pill) => {
              const active = filters.type === pill.value;
              return (
                <Button
                  key={pill.value || 'all'}
                  size="sm"
                  variant={active ? 'primary' : 'secondary'}
                  className={cn('shrink-0 px-3', !active && 'bg-white/60 dark:bg-ink-800/60')}
                  onClick={() => setFilters((f) => ({ ...f, type: pill.value, page: 1 }))}
                >
                  {pill.label}
                </Button>
              );
            })}
          </div>
        </Card>
      </div>

      {isLoading ? (
        <SkeletonLoader rows={8} />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Track every rupee — add your first transaction"
          action={{ label: 'Add transaction', onClick: () => { setEditTx(null); setFormOpen(true); } }}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([dateKey, txs]) => (
            <div key={dateKey} className="space-y-1.5">
              <div className="flex items-center gap-3 px-1">
                <Text as="span" variant="small" className="font-semibold uppercase tracking-wide text-[11px]">
                  {fmtDate(dateKey, 'EEE, dd MMM yyyy')}
                </Text>
                <div className="h-px flex-1 bg-slate-200/70 dark:bg-white/5" />
              </div>
              <div className="space-y-1.5">
                {txs.map((tx) => {
                  const cat = catMap[tx.categoryId];
                  const meta = TYPE_META[tx.type as TxType] ?? TYPE_META.expense;
                  return (
                    <Card
                      key={tx._id}
                      variant="default"
                      interactive
                      padding="sm"
                      className="group flex items-center gap-3"
                    >
                      <IconBadge icon={meta.icon} tone={meta.tone} />
                      <div className="min-w-0 flex-1">
                        <Text className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {tx.note ?? cat?.name ?? 'Transaction'}
                        </Text>
                        <Text variant="small" className="truncate">
                          {cat ? `${cat.icon} ${cat.name}` : 'Uncategorised'} · {tx.paymentMethod}
                        </Text>
                      </div>
                      <Text
                        as="span"
                        className={cn('text-sm font-bold tabular-nums', amountClass(tx.type))}
                      >
                        {amountSign(tx.type)}{fmt(tx.amount, currency)}
                      </Text>
                      <div className="flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2"
                          onClick={() => { setEditTx(tx); setFormOpen(true); }}
                          aria-label="Edit transaction"
                        >
                          <Pencil size={15} strokeWidth={2.2} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 hover:text-danger-500"
                          onClick={() => { if (confirm('Delete this transaction?')) deleteTx.mutate(tx._id); }}
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={15} strokeWidth={2.2} />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {data?.hasMore && (
            <div className="text-center">
              <Button variant="secondary" onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}

      <TransactionForm
        open={formOpen}
        onClose={closeForm}
        editTx={editTx}
        categories={categories ?? []}
      />
    </div>
  );
}
