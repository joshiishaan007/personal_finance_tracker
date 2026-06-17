'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export interface TrashTransaction {
  _id: string;
  amount: number;
  type: string;
  categoryId: string;
  date: string;
  note?: string;
  tags: string[];
  paymentMethod: string;
  deletedAt: string;
}

const RETENTION_DAYS = 30;

// Days left before MongoDB's TTL index purges the row — derived from deletedAt,
// never stored or decremented, so no scheduler is involved.
export function daysLeft(deletedAt: string): number {
  const elapsed = (Date.now() - new Date(deletedAt).getTime()) / 86_400_000;
  return Math.max(0, Math.ceil(RETENTION_DAYS - elapsed));
}

export function useTrash() {
  return useQuery({
    queryKey: ['trash'],
    queryFn: () =>
      api.get<{ data: TrashTransaction[] }>(ENDPOINTS.transactions.trash).then((r) => r.data.data),
  });
}

// Restoring/purging changes the same totals a delete did — invalidate the same keys.
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  for (const key of [['trash'], ['transactions'], ['analytics'], ['engagement'], ['spendingPlan']]) {
    void qc.invalidateQueries({ queryKey: key });
  }
}

export function useRestoreTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(ENDPOINTS.transactions.restore(id)),
    onSuccess: () => invalidateAll(qc),
  });
}

export function usePurgeTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.transactions.trashItem(id)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['trash'] }),
  });
}

export function useEmptyTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(ENDPOINTS.transactions.trash),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['trash'] }),
  });
}
