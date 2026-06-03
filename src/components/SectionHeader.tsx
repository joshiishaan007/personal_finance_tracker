import type { LucideIcon } from 'lucide-react';
import { IconBadge } from '@/components/ui/IconBadge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, icon, action }: Props) {
  return (
    <div className="flex items-center gap-3">
      {icon && <IconBadge icon={icon} />}
      <div className="min-w-0">
        <Heading level={5} className="truncate">{title}</Heading>
        {subtitle && <Text variant="small" className="mt-0.5 truncate">{subtitle}</Text>}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}
