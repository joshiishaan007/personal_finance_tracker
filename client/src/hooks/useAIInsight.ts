import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

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
      api.get<{ data: AIInsight | null }>('/api/ai/insights')
        .then((r) => r.data.data)
        .catch(() => null),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — don't re-fetch until next day
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useDismissInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/ai/insights/dismiss'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ai-insights'] }),
  });
}
