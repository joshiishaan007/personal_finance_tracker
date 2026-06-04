'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateInvestment, UpdateInvestment, InvestmentView } from '@/shared';

export function useInvestments() {
  return useQuery({
    queryKey: ['investments'],
    queryFn: () =>
      api.get<{ data: InvestmentView[] }>(ENDPOINTS.investments.list).then((r) => r.data.data),
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvestment) => api.post(ENDPOINTS.investments.create, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['investments'] }),
  });
}

export function useUpdateInvestment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInvestment) => api.patch(ENDPOINTS.investments.detail(id), data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['investments'] }),
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.investments.detail(id)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['investments'] }),
  });
}
