import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreateCategory } from '@finbuddy/shared';

export interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
  isDefault: boolean;
  monthlyBudget?: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/api/categories').then((r) => r.data.data),
    staleTime: 1000 * 60 * 15,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategory) => api.post('/api/categories', data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}
