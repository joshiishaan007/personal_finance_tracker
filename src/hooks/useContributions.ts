'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateContribution } from '@/shared';

export interface Contribution {
  _id: string;
  goalId: string;
  date: string;
  value: number;
  note?: string;
}

export function useContributions(goalId: string) {
  return useQuery({
    queryKey: ['contributions', goalId],
    queryFn: () =>
      api.get<{ data: Contribution[] }>(ENDPOINTS.contributions.list(`goalId=${goalId}`)).then((r) => r.data.data),
    enabled: !!goalId,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, goalId: string) {
  void qc.invalidateQueries({ queryKey: ['contributions', goalId] });
  void qc.invalidateQueries({ queryKey: ['lifeGoals'] }); // currentValue changed
  void qc.invalidateQueries({ queryKey: ['goalsSummary'] });
}

export function useAddContribution(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContribution) => api.post(ENDPOINTS.contributions.create, data),
    onSuccess: () => invalidate(qc, goalId),
  });
}

export function useDeleteContribution(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.contributions.detail(id)),
    onSuccess: () => invalidate(qc, goalId),
  });
}
