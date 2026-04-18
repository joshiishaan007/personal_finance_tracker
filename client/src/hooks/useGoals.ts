import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreateGoal, UpdateGoal } from '@finbuddy/shared';

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
    queryFn: () => api.get<{ data: Goal[] }>('/api/goals').then((r) => r.data.data),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoal) => api.post('/api/goals', data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoal }) => api.patch(`/api/goals/${id}`, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/goals/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
