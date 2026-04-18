import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreateTransaction, UpdateTransaction, TransactionFilter } from '@finbuddy/shared';

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

export function useTransactions(filters: Partial<TransactionFilter> = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== '') params.set(k, String(v));
  }
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () =>
      api.get<{ data: { items: Transaction[]; total: number; hasMore: boolean } }>(
        `/api/transactions?${params.toString()}`
      ).then((r) => r.data.data),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransaction) => api.post<{ data: Transaction }>('/api/transactions', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      void qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useUpdateTransaction(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTransaction) => api.patch(`/api/transactions/${id}`, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/transactions/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      void qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
