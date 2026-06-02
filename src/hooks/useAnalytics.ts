'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

interface CurrencyMeta {
  currency?: string;
}

export interface DashboardData extends CurrencyMeta {
  mtd: Array<{ _id: string; total: number }>;
  sixMonth: Array<{ _id: { month: number; year: number; type: string }; total: number }>;
  topCategories: Array<{ _id: string; total: number; category: { name: string; icon: string; color: string } }>;
  summary: { income: number; expense: number; net: number; savingsRate: number };
}

export interface MonthlyAnalytics extends CurrencyMeta {
  totals: Array<{ _id: string; total: number }>;
  byCategory: Array<{ _id: string; total: number; category: { name: string; color: string; icon: string } }>;
  byDay: Array<{ _id: { day: number; type: string }; total: number }>;
  summary: { income: number; expense: number; net: number; savingsRate: number };
}

export interface YearlyAnalytics extends CurrencyMeta {
  monthly: Array<{ _id: { month: number; type: string }; total: number }>;
}

export type CustomAnalytics = Array<{ _id: { type: string }; total: number; category?: { name: string } }>;

export function useDashboard() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () =>
      api.get<{ data: DashboardData }>(ENDPOINTS.analytics.dashboard).then((r) => r.data.data),
  });
}

export function useMonthlyAnalytics(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'monthly', year, month],
    queryFn: () =>
      api
        .get<{ data: MonthlyAnalytics }>(ENDPOINTS.analytics.monthly(`year=${year}&month=${month}`))
        .then((r) => r.data.data),
    enabled,
  });
}

export function useYearlyAnalytics(year: number, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'yearly', year],
    queryFn: () =>
      api
        .get<{ data: YearlyAnalytics }>(ENDPOINTS.analytics.yearly(`year=${year}`))
        .then((r) => r.data.data),
    enabled,
  });
}

export function useCustomAnalytics(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'custom', startDate, endDate],
    queryFn: () =>
      api
        .get<{ data: CustomAnalytics }>(
          ENDPOINTS.analytics.custom(
            `startDate=${new Date(startDate).toISOString()}&endDate=${new Date(endDate).toISOString()}`,
          ),
        )
        .then((r) => r.data.data),
    enabled: enabled && !!startDate && !!endDate,
  });
}

