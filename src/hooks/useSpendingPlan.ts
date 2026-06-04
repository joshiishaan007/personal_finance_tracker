'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { SpendingPlanView, UpdateSpendingPlan } from '@/shared';

export function useSpendingPlan() {
  return useQuery({
    queryKey: ['spendingPlan'],
    queryFn: () =>
      api.get<{ data: SpendingPlanView }>(ENDPOINTS.spendingPlan.get).then((r) => r.data.data),
  });
}

export function useUpdateSpendingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSpendingPlan) =>
      api.patch<{ data: SpendingPlanView }>(ENDPOINTS.spendingPlan.update, data).then((r) => r.data.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['spendingPlan'] }),
  });
}
