import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';

interface Props {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  empty?: boolean;
  emptyLabel?: string;
}

// Titled wrapper around a chart. Keeps every chart card visually consistent and
// handles the empty state in one place.
export function ChartCard({ title, subtitle, action, children, className, empty = false, emptyLabel = 'No data yet' }: Props) {
  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-1">
          <div>
            {title && <Heading level={6}>{title}</Heading>}
            {subtitle && <Text variant="small" className="mt-0.5">{subtitle}</Text>}
          </div>
          {action}
        </div>
      )}
      <div className="px-2 pb-3 pt-2">
        {empty
          ? <div className="flex h-[200px] items-center justify-center"><Text variant="muted" className="text-sm">{emptyLabel}</Text></div>
          : children}
      </div>
    </Card>
  );
}
