'use client';

import { Inbox, type LucideIcon } from 'lucide-react';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = Inbox, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <IconBadge icon={icon} tone="brand" size="lg" className="mb-4" />
      <Heading level={4} className="text-slate-700 dark:text-slate-300">{title}</Heading>
      {description && (
        <Text variant="muted" className="mt-1 max-w-sm">{description}</Text>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
