'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export interface PLActual {
  _id: { type: string; categoryId: string };
  actual: number;
  category?: { name: string; icon: string };
}

export interface PLBudget {
  _id: string;
  categoryId: { _id: string; name: string; icon: string } | string;
  amount: number;
}

export interface ProfitLossData {
  actual: PLActual[];
  budgets: PLBudget[];
  year: number;
  month: number;
  comparison: Array<{ categoryId: unknown; budgeted: number; spent: number; remaining: number }>;
  currency?: string;
}

export function useProfitLoss(year: number, month: number) {
  return useQuery({
    queryKey: ['pl', year, month],
    queryFn: () =>
      api.get<{ data: ProfitLossData }>(ENDPOINTS.pl(`year=${year}&month=${month}`)).then((r) => r.data.data),
  });
}
