'use client';

import { useState } from 'react';
import { Bell, PartyPopper } from 'lucide-react';
import { fmtDate } from '@/lib/utils';
import { useNotifications, useMarkAllRead } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const readAll = useMarkAllRead();

  const unread = data?.unread ?? 0;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className="relative p-2"
      >
        <Bell size={20} strokeWidth={2.2} />
        {unread > 0 && (
          <Text as="span" className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </Text>
        )}
      </Button>

      {open && (
        <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+3.75rem)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-fade-in dark:border-white/10 dark:bg-ink-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <Heading level={5}>Notifications</Heading>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => readAll.mutate()}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline px-0 min-h-0"
              >
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {(data?.notifications ?? []).length === 0 ? (
              <Text variant="muted" className="flex flex-col items-center gap-2 py-8">
                <PartyPopper size={24} strokeWidth={2.2} className="text-brand-500" />
                All caught up!
              </Text>
            ) : (
              (data?.notifications ?? []).map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-slate-50 dark:border-slate-900 last:border-0 ${
                    !n.read ? 'bg-brand-50/50 dark:bg-brand-900/30' : ''
                  }`}
                >
                  <Text className="font-medium">{n.title}</Text>
                  <Text variant="muted" className="text-xs mt-0.5">{n.body}</Text>
                  <Text variant="small" className="mt-1">{fmtDate(n.createdAt)}</Text>
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
