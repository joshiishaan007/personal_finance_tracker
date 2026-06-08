'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { CreateInstantCard } from '@/shared';

export interface InstantCard {
  _id:           string;
  amount:        number;
  type:          string;
  categoryId:    string;
  paymentMethod: string;
  note?:         string;
  tags:          string[];
}

export function useInstantCards() {
  return useQuery({
    queryKey: ['instantCards'],
    queryFn: () =>
      api.get<{ data: InstantCard[] }>(ENDPOINTS.instantCards.list).then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateInstantCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInstantCard) => api.post(ENDPOINTS.instantCards.create, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['instantCards'] }),
  });
}

export function useDeleteInstantCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(ENDPOINTS.instantCards.detail(id)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['instantCards'] }),
  });
}
