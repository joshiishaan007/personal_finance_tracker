'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateLifeGoal, UpdateLifeGoal, LifeGoalArea, LifeGoalStatus } from '@/shared';

export interface LifeGoal {
  _id: string;
  title: string;
  description?: string;
  area: LifeGoalArea;
  icon: string;
  color: string;
  status: LifeGoalStatus;
  targetValue?: number;
  dailyTarget?: number;
  unit?: string;
  currentValue: number;
  manualProgress?: number;
  targetDate?: string;
  createdAt: string;
}

export interface GoalToday {
  goalId: string;
  todayValue: number;
  streak: number;
}

export interface GoalsSummary {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  overallProgress: number;
  streak: number;
  tasksOpen: number;
  tasksOverdue: number;
}

// Progress%: measurable goals use current/target, others manualProgress.
export function lifeGoalProgress(g: Pick<LifeGoal, 'targetValue' | 'currentValue' | 'manualProgress'>): number {
  if (g.targetValue && g.targetValue > 0) return Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
  return g.manualProgress ?? 0;
}

export function useLifeGoals() {
  return useQuery({
    queryKey: ['lifeGoals'],
    queryFn: () => api.get<{ data: LifeGoal[] }>(ENDPOINTS.lifeGoals.list).then((r) => r.data.data),
  });
}

export function useLifeGoal(id: string) {
  return useQuery({
    queryKey: ['lifeGoals', id],
    queryFn: () => api.get<{ data: LifeGoal }>(ENDPOINTS.lifeGoals.detail(id)).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useGoalsSummary() {
  return useQuery({
    queryKey: ['goalsSummary'],
    queryFn: () => api.get<{ data: GoalsSummary }>(ENDPOINTS.lifeGoals.summary).then((r) => r.data.data),
    staleTime: 1000 * 60,
  });
}

// Per-goal today value + streak, keyed by goalId for quick lookup on the home.
export function useGoalsToday() {
  return useQuery({
    queryKey: ['goalsToday'],
    queryFn: async () => {
      const rows = await api.get<{ data: GoalToday[] }>(ENDPOINTS.lifeGoals.today).then((r) => r.data.data);
      return Object.fromEntries(rows.map((r) => [r.goalId, r])) as Record<string, GoalToday>;
    },
    staleTime: 1000 * 30,
  });
}

export function useCreateLifeGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLifeGoal) => api.post(ENDPOINTS.lifeGoals.create, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lifeGoals'] });
      void qc.invalidateQueries({ queryKey: ['goalsSummary'] });
    },
  });
}

export function useUpdateLifeGoal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLifeGoal) => api.patch(ENDPOINTS.lifeGoals.detail(id), data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lifeGoals'] });
      void qc.invalidateQueries({ queryKey: ['goalsSummary'] });
    },
  });
}

export function useDeleteLifeGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.lifeGoals.detail(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lifeGoals'] });
      void qc.invalidateQueries({ queryKey: ['goalsSummary'] });
      void qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
