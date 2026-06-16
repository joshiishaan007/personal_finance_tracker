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

export interface HeatmapDay {
  date: string; // 'YYYY-MM-DD'
  value: number;
}

export function useContributions(goalId: string) {
  return useQuery({
    queryKey: ['contributions', goalId],
    queryFn: () =>
      api.get<{ data: Contribution[] }>(ENDPOINTS.contributions.list(`goalId=${goalId}`)).then((r) => r.data.data),
    enabled: !!goalId,
  });
}

export function useContributionHeatmap(from: string, to: string, goalId?: string) {
  return useQuery({
    queryKey: ['contributionHeatmap', from, to, goalId ?? 'all'],
    queryFn: () => {
      const qs = new URLSearchParams({ from, to, ...(goalId ? { goalId } : {}) }).toString();
      return api
        .get<{ data: { days: HeatmapDay[]; peak: number } }>(ENDPOINTS.contributions.heatmap(qs))
        .then((r) => r.data.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, goalId?: string) {
  if (goalId) void qc.invalidateQueries({ queryKey: ['contributions', goalId] });
  else void qc.invalidateQueries({ queryKey: ['contributions'] });
  void qc.invalidateQueries({ queryKey: ['lifeGoals'] });
  void qc.invalidateQueries({ queryKey: ['goalsSummary'] });
  void qc.invalidateQueries({ queryKey: ['goalsToday'] });
  void qc.invalidateQueries({ queryKey: ['contributionHeatmap'] });
}

export function useAddContribution(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContribution) => api.post(ENDPOINTS.contributions.create, data),
    onSuccess: () => invalidate(qc, goalId),
  });
}

// Goal-agnostic logger for the goals home one-tap "log today" across many cards.
export function useLogContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContribution) => api.post(ENDPOINTS.contributions.create, data),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteContribution(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.contributions.detail(id)),
    onSuccess: () => invalidate(qc, goalId),
  });
}
