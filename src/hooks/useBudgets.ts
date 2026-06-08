'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateBudget } from '@/shared';

export interface Budget {
  _id: string;
  categoryId: { _id: string; name: string; icon: string; color: string } | string;
  amount: number;
  period: string;
  rollover: boolean;
  rolloverBalance: number;
}

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get<{ data: Budget[] }>(ENDPOINTS.budgets.list).then((r) => r.data.data),
  });
}

interface MonthlyActuals {
  totals: unknown[];
  byCategory: Array<{ _id: string; total: number }>;
}

export function useMonthlyActuals(year: number, month: number) {
  const qs = `year=${year}&month=${month}`;
  return useQuery({
    queryKey: ['analytics', 'monthly', year, month],
    queryFn: () =>
      api.get<{ data: MonthlyActuals }>(ENDPOINTS.analytics.monthly(qs)).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudget) => api.post(ENDPOINTS.budgets.create, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.budgets.detail(id)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
