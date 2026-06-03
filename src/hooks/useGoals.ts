'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateGoal, UpdateGoal } from '@/shared';

export interface Goal {
  _id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  status: 'active' | 'achieved' | 'paused';
  milestonesHit: number[];
  createdAt: string;
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get<{ data: Goal[] }>(ENDPOINTS.goals.list).then((r) => r.data.data),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoal) => api.post(ENDPOINTS.goals.create, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoal }) =>
      api.patch(ENDPOINTS.goals.detail(id), data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.goals.detail(id)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
