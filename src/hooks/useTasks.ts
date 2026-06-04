'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateTask, UpdateTask, TaskPriority } from '@/shared';

export interface Task {
  _id: string;
  title: string;
  done: boolean;
  doneAt?: string;
  dueDate?: string;
  goalId?: string;
  priority: TaskPriority;
}

export function useTasks(filter: Record<string, string> = {}) {
  const qs = new URLSearchParams(filter).toString();
  return useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => api.get<{ data: Task[] }>(ENDPOINTS.tasks.list(qs)).then((r) => r.data.data),
  });
}

function invalidateTasks(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['tasks'] });
  void qc.invalidateQueries({ queryKey: ['goalsSummary'] });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTask) => api.post(ENDPOINTS.tasks.create, data),
    onSuccess: () => invalidateTasks(qc),
  });
}

// Parameterless so one instance can update any task in a list.
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTask }) => api.patch(ENDPOINTS.tasks.detail(id), data),
    onSuccess: () => invalidateTasks(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.tasks.detail(id)),
    onSuccess: () => invalidateTasks(qc),
  });
}
