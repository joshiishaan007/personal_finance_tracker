'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateCategory } from '@/shared';

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
    queryFn: () => api.get<{ data: Category[] }>(ENDPOINTS.categories.list).then((r) => r.data.data),
    staleTime: 1000 * 60 * 15,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategory) => api.post(ENDPOINTS.categories.create, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}
