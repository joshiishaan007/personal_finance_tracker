'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateGrossPL, UpdateGrossPL, GrossPLSummary } from '@/shared';

export function useGrossPL() {
  return useQuery({
    queryKey: ['grossPL'],
    queryFn: () =>
      api.get<{ data: GrossPLSummary }>(ENDPOINTS.grossPL.list).then((r) => r.data.data),
  });
}

export function useCreateGrossPL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGrossPL) => api.post(ENDPOINTS.grossPL.create, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['grossPL'] }),
  });
}

export function useUpdateGrossPL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGrossPL }) =>
      api.patch(ENDPOINTS.grossPL.detail(id), data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['grossPL'] }),
  });
}

export function useDeleteGrossPL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.grossPL.detail(id)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['grossPL'] }),
  });
}
