'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { ParsedDraft } from '@/shared';

export function useQuickParse() {
  return useMutation({
    mutationFn: (text: string) =>
      api.post<{ data: ParsedDraft }>(ENDPOINTS.ai.parse, { text }).then((r) => r.data.data),
  });
}
