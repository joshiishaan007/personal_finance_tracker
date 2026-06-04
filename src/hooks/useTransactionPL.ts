'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export interface MonthPL {
  label: string;   // e.g. "Jan 24"
  net: number;     // income - expense for the month (minor units)
  cumulative: number;
  income: number;
  expense: number;
}

export interface TransactionPLSummary {
  months: MonthPL[];
  cumulative: number;
  totalIncome: number;
  totalExpense: number;
}

export function useTransactionPL() {
  return useQuery({
    queryKey: ['analytics', 'pl'],
    queryFn: () =>
      api.get<{ data: TransactionPLSummary }>(ENDPOINTS.analytics.pl).then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });
}
