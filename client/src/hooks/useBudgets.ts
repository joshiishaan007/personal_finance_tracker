import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreateBudget } from '@finbuddy/shared';

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
    queryFn: () => api.get<{ data: Budget[] }>('/api/budgets').then((r) => r.data.data),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudget) => api.post('/api/budgets', data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/budgets/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
