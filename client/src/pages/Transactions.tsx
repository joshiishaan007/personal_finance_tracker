import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { fmt, fmtDate, cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/EmptyState';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { TransactionForm } from './TransactionForm';

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  date: string;
  note?: string;
  tags: string[];
  paymentMethod: string;
  categoryId: string;
}

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'investment', label: 'Investment' },
];

export function Transactions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({ type: '', search: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(filters.page), limit: '50' });
      if (filters.type) params.set('type', filters.type);
      if (filters.search) params.set('search', filters.search);
      return api.get<{ data: { items: Transaction[]; total: number; hasMore: boolean } }>(
        `/api/transactions?${params.toString()}`
      ).then((r) => r.data.data);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories').then((r) => r.data.data),
  });

  const deleteTx = useMutation({
    mutationFn: (id: string) => api.delete(`/api/transactions/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const currency = user?.currency ?? 'INR';
  const catMap = Object.fromEntries((categories ?? []).map((c) => [c._id, c]));

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  for (const tx of data?.items ?? []) {
    const key = fmtDate(tx.date, 'yyyy-MM-dd');
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(tx);
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={() => { setEditTx(null); setFormOpen(true); }} size="sm">+ New</Button>
      </div>

      {/* Filters */}
      <Card padding="sm" className="flex flex-wrap gap-3 p-3">
        <div className="flex-1 min-w-40">
          <Input
            placeholder="Search notes, tags…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          />
        </div>
        <div className="w-36">
          <Select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
            options={TYPE_OPTIONS}
          />
        </div>
      </Card>

      {isLoading ? (
        <SkeletonLoader rows={8} />
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon="💸"
          title="No transactions yet"
          description="Track every rupee — add your first transaction"
          action={{ label: '+ Add transaction', onClick: () => setFormOpen(true) }}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([dateKey, txs]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {fmtDate(dateKey, 'EEE, dd MMM yyyy')}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="space-y-1">
                {txs.map((tx) => {
                  const cat = catMap[tx.categoryId];
                  return (
                    <div
                      key={tx._id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: cat?.color ? `${cat.color}22` : '#6B728022' }}
                      >
                        {cat?.icon ?? '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.note ?? cat?.name ?? 'Transaction'}</p>
                        <p className="text-xs text-slate-500">{cat?.name} · {tx.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'text-sm font-semibold',
                          tx.type === 'income' ? 'text-success-500' : tx.type === 'expense' ? 'text-danger-500' : 'text-slate-600',
                        )}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{fmt(tx.amount, currency)}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={() => { setEditTx(tx); setFormOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded"
                          aria-label="Edit"
                        >✏️</button>
                        <button
                          onClick={() => { if (confirm('Delete this transaction?')) deleteTx.mutate(tx._id); }}
                          className="p-1.5 text-slate-400 hover:text-danger-500 rounded"
                          aria-label="Delete"
                        >🗑️</button>
                      </div>
                    </div>
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
        onClose={() => setFormOpen(false)}
        editTx={editTx}
        categories={categories ?? []}
      />
    </div>
  );
}
