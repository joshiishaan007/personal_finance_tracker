'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { UpsertNetWorth } from '@/shared';

export interface NetWorthSnapshot {
  _id: string;
  date: string;
  assets: { cash: number; bank: number; property: number; vehicles: number; other: number };
  liabilities: { loans: number; credit: number; other: number };
  netWorth: number;
}

export function useNetWorth() {
  return useQuery({
    queryKey: ['net-worth'],
    queryFn: () =>
      api.get<{ data: NetWorthSnapshot[] }>(ENDPOINTS.netWorth.list).then((r) => r.data.data),
  });
}

export function useUpsertNetWorth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertNetWorth) => api.post(ENDPOINTS.netWorth.create, data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['net-worth'] }),
  });
}
