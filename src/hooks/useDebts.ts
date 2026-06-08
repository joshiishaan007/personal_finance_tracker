'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateDebt, DebtView, DebtSummaryItem } from '@/shared';

export type { DebtView, DebtSummaryItem };

export function useDebtSummary() {
  return useQuery({
    queryKey: ['debts', 'summary'],
    queryFn: () =>
      api.get<{ data: DebtSummaryItem[] }>(ENDPOINTS.debts.summary).then((r) => r.data.data),
    staleTime: 1000 * 60 * 2,
  });
}

export function useFriendDebts(friendName: string | null, status: 'pending' | 'settled' = 'pending') {
  const qs = friendName
    ? new URLSearchParams({ friendName, status }).toString()
    : '';
  return useQuery({
    queryKey: ['debts', 'friend', friendName, status],
    queryFn: () =>
      api.get<{ data: DebtView[] }>(ENDPOINTS.debts.list(qs)).then((r) => r.data.data),
    enabled: !!friendName,
    staleTime: 1000 * 60 * 2,
  });
}

export function useTransactionDebts(txId: string | null | undefined) {
  const qs = txId ? new URLSearchParams({ sourceTxId: txId, status: 'all' }).toString() : '';
  return useQuery({
    queryKey: ['debts', 'tx', txId],
    queryFn: () =>
      api.get<{ data: DebtView[] }>(ENDPOINTS.debts.list(qs)).then((r) => r.data.data),
    enabled: !!txId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSettledDebts() {
  const qs = new URLSearchParams({ status: 'settled' }).toString();
  return useQuery({
    queryKey: ['debts', 'settled'],
    queryFn: () =>
      api.get<{ data: DebtView[] }>(ENDPOINTS.debts.list(qs)).then((r) => r.data.data),
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
