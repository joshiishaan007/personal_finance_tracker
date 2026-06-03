'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<{ data: { notifications: Notification[]; unread: number } }>(ENDPOINTS.notifications.list)
        .then((r) => r.data.data),
    refetchInterval: 60000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch(ENDPOINTS.notifications.readAll),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
