import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { fmtDate } from '../lib/utils';

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ data: { notifications: Notification[]; unread: number } }>('/api/notifications').then((r) => r.data.data),
    refetchInterval: 60000,
  });

  const readAll = useMutation({
    mutationFn: () => api.patch('/api/notifications/read-all'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data?.unread ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={() => readAll.mutate()}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {(data?.notifications ?? []).length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">All caught up! 🎉</p>
            ) : (
              (data?.notifications ?? []).map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-slate-50 dark:border-slate-900 last:border-0 ${
                    !n.read ? 'bg-brand-50/50 dark:bg-brand-950/30' : ''
                  }`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{fmtDate(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}
