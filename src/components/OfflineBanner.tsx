'use client';

import { CloudOff } from 'lucide-react';
import { Text } from '@/components/ui/Text';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-warn-500/15 px-4 py-1.5 text-warn-700 dark:text-warn-300">
      <CloudOff size={14} strokeWidth={2.2} />
      <Text as="span" className="text-xs font-medium text-current">
        Offline — changes are saved on this device and sync when you reconnect.
      </Text>
    </div>
  );
}
