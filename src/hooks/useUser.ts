'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import type { ImportResult } from '@/shared';

export function useUpdatePreferences(refetchUser?: () => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Record<string, unknown>) => api.patch(ENDPOINTS.user.preferences, prefs),
    onSuccess: () => {
      void refetchUser?.();
      void qc.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (confirmEmail: string) =>
      api.delete(ENDPOINTS.user.account, { data: { confirmEmail } }),
  });
}

export function useImportJson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (backup: unknown) =>
      api.post<{ data: ImportResult }>(ENDPOINTS.import.json, backup).then((r) => r.data.data),
    onSuccess: () => {
      for (const key of [
        ['transactions'], ['trash'], ['categories'], ['budgets'], ['goals'],
        ['analytics'], ['spendingPlan'], ['engagement'], ['balance'],
      ]) {
        void qc.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export function useExportJson() {
  return useMutation({
    mutationFn: () => api.get(ENDPOINTS.export.json, { responseType: 'blob' }),
    onSuccess: (response) => {
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-finance-tracker-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
