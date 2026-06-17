'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
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
  incurredAt?: string;
  note?: string;
  tags: string[];
  paymentMethod: string;
  isRecurring: boolean;
  investmentId?: string;
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
    placeholderData: keepPreviousData,
  });
}

// Infinite-scroll variant — accumulates pages client-side.
export function useInfiniteTransactions(filters: Omit<Partial<TransactionFilter>, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', filters],
    queryFn: ({ pageParam }: { pageParam: number }) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== '') params.set(k, String(v));
      }
      params.set('page', String(pageParam));
      if (!params.has('limit')) params.set('limit', '20');
      return api
        .get<{ data: { items: Transaction[]; total: number; hasMore: boolean } }>(
          ENDPOINTS.transactions.list(params.toString()),
        )
        .then((r) => r.data.data);
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTransaction): Promise<string> => {
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
        // Offline: clientId will become the server _id on replay.
        return clientId;
      }

      const resp = await api.post<{ data: { _id: string } }>(ENDPOINTS.transactions.create, body);
      return resp.data.data._id;
    },
    onSuccess: () => {
      // Offline: keep the optimistic cache and skip refetches that would just fail.
      if (isOffline()) return;
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      void qc.invalidateQueries({ queryKey: ['analytics'] });
      void qc.invalidateQueries({ queryKey: ['engagement'] });
      // Income/expense changes shift the month's base income and bucket usage.
      void qc.invalidateQueries({ queryKey: ['spendingPlan'] });
    },
  });
}

// Patch a transaction in-place across every cached transaction list (regular and
// infinite shapes) so an offline edit shows immediately.
function patchCachedTransaction(qc: ReturnType<typeof useQueryClient>, id: string, data: UpdateTransaction) {
  qc.setQueriesData({ queryKey: ['transactions'] }, (old: unknown) => {
    if (!old || typeof old !== 'object') return old;
    const merge = (t: Transaction) => (t._id === id ? { ...t, ...data } as Transaction : t);
    if ('pages' in old) {
      const o = old as { pages: { items: Transaction[] }[] };
      return { ...o, pages: o.pages.map((p) => ({ ...p, items: p.items.map(merge) })) };
    }
    if ('items' in old) {
      const o = old as { items: Transaction[] };
      return { ...o, items: o.items.map(merge) };
    }
    return old;
  });
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateTransaction) => {
      if (isOffline()) {
        // Queue the edit (replays on reconnect) and reflect it in the cache now.
        await enqueue(ENDPOINTS.transactions.detail(id), 'PATCH', data);
        patchCachedTransaction(qc, id, data);
        return;
      }
      return api.patch(ENDPOINTS.transactions.detail(id), data);
    },
    onSuccess: () => {
      if (isOffline()) return; // keep the optimistic cache; OfflineSync refreshes on reconnect
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      void qc.invalidateQueries({ queryKey: ['analytics'] });
      void qc.invalidateQueries({ queryKey: ['spendingPlan'] });
    },
  });
}

function removeCachedTransaction(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.setQueriesData({ queryKey: ['transactions'] }, (old: unknown) => {
    if (!old || typeof old !== 'object') return old;
    if ('pages' in old) {
      const o = old as { pages: { items: Transaction[]; total: number }[] };
      return { ...o, pages: o.pages.map((p) => ({ ...p, items: p.items.filter((t) => t._id !== id), total: Math.max(0, p.total - 1) })) };
    }
    if ('items' in old) {
      const o = old as { items: Transaction[]; total: number };
      return { ...o, items: o.items.filter((t) => t._id !== id), total: Math.max(0, o.total - 1) };
    }
    return old;
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOffline()) {
        await enqueue(ENDPOINTS.transactions.detail(id), 'DELETE', undefined);
        removeCachedTransaction(qc, id);
        return;
      }
      return api.delete(ENDPOINTS.transactions.detail(id));
    },
    onSuccess: () => {
      if (isOffline()) return; // keep the optimistic removal; OfflineSync refreshes on reconnect
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      void qc.invalidateQueries({ queryKey: ['trash'] });
      void qc.invalidateQueries({ queryKey: ['analytics'] });
      void qc.invalidateQueries({ queryKey: ['engagement'] });
      // Deleting a settlement tx reverts its linked debt to pending server-side.
      void qc.invalidateQueries({ queryKey: ['debts'] });
      // Deleting an EMI expense drops the linked loan payment.
      void qc.invalidateQueries({ queryKey: ['loans'] });
      // Deleting an income/expense changes the month's base income and bucket usage.
      void qc.invalidateQueries({ queryKey: ['spendingPlan'] });
    },
  });
}
