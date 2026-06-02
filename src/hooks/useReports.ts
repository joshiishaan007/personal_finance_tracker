'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export interface MonthlyReport {
  grade: string;
  composite: number;
  savingsRate: number;
  savingsScore: number;
  budgetScore: number;
  goalScore: number;
  income: number;
  expense: number;
  year: number;
  month: number;
}

export interface YearlyReport {
  monthly: Array<{ _id: { month: number; type: string }; total: number }>;
  goalsAchieved: number;
  year: number;
}

export function useMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn: () =>
      api
        .get<{ data: MonthlyReport }>(ENDPOINTS.reports.monthly(`year=${year}&month=${month}`))
        .then((r) => r.data.data),
  });
}

export function useYearlyReport(year: number) {
  return useQuery({
    queryKey: ['reports', 'yearly', year],
    queryFn: () =>
      api.get<{ data: YearlyReport }>(ENDPOINTS.reports.yearly(`year=${year}`)).then((r) => r.data.data),
  });
}
