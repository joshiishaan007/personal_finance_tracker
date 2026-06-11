'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateDebt, DebtView, DebtSummaryItem, DebtListResult, DebtDirection } from '@/shared';

export type { DebtView, DebtSummaryItem, DebtDirection };

export function useDebtSummary(direction: DebtDirection = 'they_owe_me') {
  return useQuery({
    queryKey: ['debts', 'summary', direction],
    queryFn: () =>
      api.get<{ data: DebtSummaryItem[] }>(
        ENDPOINTS.debts.summary(new URLSearchParams({ direction }).toString()),
      ).then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}

// Single-page fetch — use for small/bounded lists (transaction form, duplicate detection).
export function useFriendDebts(
  friendName: string | null,
  status: 'pending' | 'settled' = 'pending',
  direction: DebtDirection = 'they_owe_me',
) {
  const qs = friendName
    ? new URLSearchParams({ friendName, status, direction, limit: '100' }).toString()
    : '';
  return useQuery({
    queryKey: ['debts', 'friend', direction, friendName, status],
    queryFn: () =>
      api.get<{ data: DebtListResult }>(ENDPOINTS.debts.list(qs)).then((r) => r.data.data.items),
    enabled: !!friendName,
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}

// Infinite query — use in FriendDebtsModal for paginated scrollable lists.
export function useInfiniteFriendDebts(
  friendName: string | null,
  status: 'pending' | 'settled' = 'pending',
  direction: DebtDirection = 'they_owe_me',
) {
  return useInfiniteQuery({
    queryKey: ['debts', 'friend', direction, friendName, status, 'inf'],
    queryFn: ({ pageParam }: { pageParam: number }) => {
      const qs = new URLSearchParams({
        friendName: friendName!,
        status,
        direction,
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
  // direction 'all' — a tx may be a split source (they_owe_me) regardless of card.
  const qs = txId ? new URLSearchParams({ sourceTxId: txId, status: 'all', direction: 'all', limit: '100' }).toString() : '';
  return useQuery({
    queryKey: ['debts', 'tx', txId],
    queryFn: () =>
      api.get<{ data: DebtListResult }>(ENDPOINTS.debts.list(qs)).then((r) => r.data.data.items),
    enabled: !!txId,
    staleTime: 1000 * 60 * 2,
  });
}

// Fetches all settled entries across all friends for the outer summary card.
export function useSettledDebts(direction: DebtDirection = 'they_owe_me') {
  const qs = new URLSearchParams({ status: 'settled', direction, limit: '100' }).toString();
  return useQuery({
    queryKey: ['debts', 'settled', direction],
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
