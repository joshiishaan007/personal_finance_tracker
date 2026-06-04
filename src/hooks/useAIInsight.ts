'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export interface AIInsight {
  insights: Array<{
    type: string;
    title: string;
    body: string;
    why: string;
    dataPoints: Record<string, number>;
  }>;
}

export function useAIInsight() {
  return useQuery({
    queryKey: ['ai-insights'],
    queryFn: () =>
      api.get<{ data: AIInsight | null }>(ENDPOINTS.ai.insights)
        .then((r) => r.data.data)
        .catch(() => null),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — don't re-fetch until next day
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Explicit, user-triggered generation (calls Gemini). Kept out of the dashboard
// query so the app never spends quota on its own.
export function useGenerateInsight() {
  const qc = useQueryClient();
  return useMutation({
    // 65s: just above maxDuration (60s) so the server-side SDK timeout fires
    // first and returns a structured error rather than an aborted request.
    mutationFn: () =>
      api.post<{ data: AIInsight | null }>(ENDPOINTS.ai.generate, undefined, { timeout: 65_000 }).then((r) => r.data.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ai-insights'] }),
  });
}

export function useDismissInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(ENDPOINTS.ai.dismiss),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ai-insights'] }),
  });
}
