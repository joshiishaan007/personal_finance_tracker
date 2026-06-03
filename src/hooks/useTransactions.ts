'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import { enqueue } from '@/lib/offlineQueue';
import type { CreateTransaction, UpdateTransaction, TransactionFilter, PaymentMethod } from '@/shared';

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

function newClientId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export interface Transaction {
  _id: string;
  amount: number;
  type: string;
  categoryId: string;
  date: string;
  note?: string;
  tags: string[];
  paymentMethod: string;
  isRecurring: boolean;
}

export interface FrequentTemplate {
  categoryId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  count: number;
  categoryName: string | null;
  categoryIcon: string | null;
}

export function useFrequentTransactions() {
  return useQuery({
    queryKey: ['transactions', 'frequent'],
    queryFn: () =>
      api.get<{ data: FrequentTemplate[] }>(ENDPOINTS.transactions.frequent).then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTransactions(filters: Partial<TransactionFilter> = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== '') params.set(k, String(v));
  }
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () =>
      api.get<{ data: { items: Transaction[]; total: number; hasMore: boolean } }>(
        ENDPOINTS.transactions.list(params.toString())
      ).then((r) => r.data.data),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTransaction): Promise<void> => {
      const clientId = data.clientId ?? newClientId();
      const body = { ...data, clientId };

      if (isOffline()) {
        // Persist to the IndexedDB queue; it replays on reconnect. The server
        // upserts on clientId, so a replay never duplicates.
        await enqueue(ENDPOINTS.transactions.create, 'POST', body);
        const echo: Transaction = {
          _id: clientId, amount: body.amount, type: body.type, categoryId: body.categoryId,
          date: body.date, note: body.note, tags: body.tags ?? [],
          paymentMethod: body.paymentMethod, isRecurring: body.isRecurring ?? false,
        };
        // Optimistically show it in any cached transaction list (skip non-list
        // caches like ['transactions','frequent']).
        qc.setQueriesData({ queryKey: ['transactions'] }, (old: unknown) => {
          if (old && typeof old === 'object' && 'items' in old) {
            const o = old as { items: Transaction[]; total: number; hasMore: boolean };
            return { ...o, items: [echo, ...o.items], total: o.total + 1 };
          }
          return old;
        });
        return;
      }

      await api.post(ENDPOINTS.transactions.create, body);
    },
    onSuccess: () => {
      // Offline: keep the optimistic cache and skip refetches that would just fail.
      if (isOffline()) return;
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      void qc.invalidateQueries({ queryKey: ['analytics'] });
      void qc.invalidateQueries({ queryKey: ['engagement'] });
    },
  });
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTransaction) => api.patch(ENDPOINTS.transactions.detail(id), data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.transactions.detail(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      void qc.invalidateQueries({ queryKey: ['analytics'] });
      void qc.invalidateQueries({ queryKey: ['engagement'] });
    },
  });
}
