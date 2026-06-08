'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateDebt, DebtView, DebtSummaryItem, DebtListResult } from '@/shared';

export type { DebtView, DebtSummaryItem };

export function useDebtSummary() {
  return useQuery({
    queryKey: ['debts', 'summary'],
    queryFn: () =>
      api.get<{ data: DebtSummaryItem[] }>(ENDPOINTS.debts.summary).then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}

// Single-page fetch — use for small/bounded lists (transaction form, duplicate detection).
export function useFriendDebts(friendName: string | null, status: 'pending' | 'settled' = 'pending') {
  const qs = friendName
    ? new URLSearchParams({ friendName, status, limit: '100' }).toString()
    : '';
  return useQuery({
    queryKey: ['debts', 'friend', friendName, status],
    queryFn: () =>
      api.get<{ data: DebtListResult }>(ENDPOINTS.debts.list(qs)).then((r) => r.data.data.items),
    enabled: !!friendName,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}

// Infinite query — use in FriendDebtsModal for paginated scrollable lists.
export function useInfiniteFriendDebts(friendName: string | null, status: 'pending' | 'settled' = 'pending') {
  return useInfiniteQuery({
    queryKey: ['debts', 'friend', friendName, status, 'inf'],
    queryFn: ({ pageParam }: { pageParam: number }) => {
      const qs = new URLSearchParams({
        friendName: friendName!,
        status,
        page:  String(pageParam),
        limit: '20',
      }).toString();
      return api.get<{ data: DebtListResult }>(ENDPOINTS.debts.list(qs)).then((r) => r.data.data);
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + 1 : undefined,
    initialPageParam: 1,
    enabled: !!friendName,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}

export function useTransactionDebts(txId: string | null | undefined) {
  const qs = txId ? new URLSearchParams({ sourceTxId: txId, status: 'all', limit: '100' }).toString() : '';
  return useQuery({
    queryKey: ['debts', 'tx', txId],
    queryFn: () =>
      api.get<{ data: DebtListResult }>(ENDPOINTS.debts.list(qs)).then((r) => r.data.data.items),
    enabled: !!txId,
    staleTime: 1000 * 60 * 2,
  });
}

// Fetches all settled entries across all friends for the outer summary card.
export function useSettledDebts() {
  const qs = new URLSearchParams({ status: 'settled', limit: '100' }).toString();
  return useQuery({
    queryKey: ['debts', 'settled'],
    queryFn: () =>
      api.get<{ data: DebtListResult }>(ENDPOINTS.debts.list(qs)).then((r) => r.data.data.items),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateDebts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (debts: CreateDebt[]) => api.post(ENDPOINTS.debts.create, debts),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount?: number; status?: 'pending' | 'settled'; note?: string; transactionId?: string } }) =>
      api.patch(ENDPOINTS.debts.detail(id), data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.debts.detail(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}

export function useCleanupSettledDebts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<{ data: { deleted: number } }>(ENDPOINTS.debts.cleanup),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['debts'] });
    },
  });
}
