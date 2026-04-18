import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

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
      api.get<{ data: { notifications: Notification[]; unread: number } }>('/api/notifications')
        .then((r) => r.data.data),
    refetchInterval: 60000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/api/notifications/read-all'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
