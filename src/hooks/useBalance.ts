'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export interface Balance {
  total: number;
  openingBalance: number;
  income: number;
  expense: number;
  currency: string;
}

export function useBalance() {
  return useQuery({
    queryKey: ['balance'],
    queryFn: () => api.get<{ data: Balance }>(ENDPOINTS.balance).then((r) => r.data.data),
  });
}
