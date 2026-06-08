'use client';

import { Bell, BellOff, BellRing } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

export function BudgetAlertBanner() {
  const { supported, subscribed, permission, loading, subscribe, unsubscribe } =
    usePushNotifications();

  // Not supported on this browser / not running as installed PWA.
  if (!supported) return null;

  if (subscribed) {
    return (
      <Card variant="glass" padding="sm">
        <div className="flex items-center gap-3">
          <BellRing size={16} strokeWidth={2.2} className="text-brand-500 shrink-0" />
          <div className="flex-1">
            <Text className="text-sm font-medium">Budget alerts on</Text>
            <Text variant="small" className="text-slate-500">
              You&apos;ll get notified at 85 %, 90 %, and on every transaction after that.
            </Text>
          </div>
          <Button
            variant="ghost"
            size="sm"
            loading={loading}
            leftIcon={<BellOff size={14} strokeWidth={2.2} />}
            onClick={() => void unsubscribe()}
            className="shrink-0 text-slate-500 hover:text-danger-500"
          >
            Disable
          </Button>
        </div>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card variant="glass" padding="sm">
        <div className="flex items-center gap-2.5">
          <BellOff size={15} strokeWidth={2.2} className="text-slate-400 shrink-0" />
          <Text variant="small" className="text-slate-500">
            Notifications are blocked in your browser — enable them in site settings to get budget alerts.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="sm">
      <div className="flex items-center gap-3">
        <Bell size={16} strokeWidth={2.2} className="text-brand-500 shrink-0" />
        <div className="flex-1">
          <Text className="text-sm font-medium">Enable budget alerts</Text>
          <Text variant="small" className="text-slate-500">
            Get notified when you hit 85 % and 90 % of any monthly budget.
          </Text>
        </div>
        <Button
          variant="gradient"
          size="sm"
          loading={loading}
          leftIcon={<BellRing size={14} strokeWidth={2.4} />}
          onClick={() => void subscribe()}
          className="shrink-0"
        >
          Enable
        </Button>
      </div>
    </Card>
  );
}
