'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateRecurringRule, UpdateRecurringRule } from '@/shared';

export interface RecurringRule {
  _id: string;
  templateTransaction: {
    amount: number;
    type: string;
    note?: string;
    categoryId: string;
    paymentMethod: string;
  };
  frequency: string;
  nextDueDate: string;
  autoPost: boolean;
  isActive: boolean;
}

export function useRecurring() {
  return useQuery({
    queryKey: ['recurring'],
    queryFn: () =>
      api.get<{ data: RecurringRule[] }>(ENDPOINTS.recurring.list).then((r) => r.data.data),
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringRule) => api.post(ENDPOINTS.recurring.create, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringRule }) =>
      api.patch(ENDPOINTS.recurring.detail(id), data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.recurring.detail(id)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}
