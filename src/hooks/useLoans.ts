'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateLoan, UpdateLoan, AddLoanPayment, LoanView } from '@/shared';

export type { LoanView };

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: () => api.get<{ data: LoanView[] }>(ENDPOINTS.loans.list).then((r) => r.data.data),
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoan) => api.post(ENDPOINTS.loans.create, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}

export function useUpdateLoan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLoan) => api.patch(ENDPOINTS.loans.detail(id), data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}

export function useDeleteLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.loans.detail(id)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}

// Records a paid EMI (the linked expense is created separately, client-side).
export function useAddLoanPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddLoanPayment }) =>
      api.post(ENDPOINTS.loans.payment(id), data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}
