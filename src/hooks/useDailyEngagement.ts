'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { DailyEngagement } from '@/shared';

export function useDailyEngagement() {
  return useQuery({
    queryKey: ['engagement', 'daily'],
    queryFn: () =>
      api.get<{ data: DailyEngagement }>(ENDPOINTS.engagement.daily).then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });
}
