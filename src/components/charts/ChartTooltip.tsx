'use client';

import { Text } from '@/components/ui/Text';

interface Item {
  name?: string;
  value?: number;
  color?: string;
}

interface Props {
  active?: boolean;
  payload?: Item[];
  label?: string | number;
  formatValue?: (v: number) => string;
}

// Glassy custom tooltip shared by every chart. recharts injects active/payload/label.
export function ChartTooltip({ active, payload, label, formatValue }: Props) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-card-lg min-w-[120px]">
      {label != null && (
        <Text as="span" className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-200">{label}</Text>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <Text as="span" variant="muted" className="text-xs capitalize">{p.name}</Text>
            <Text as="span" className="ml-auto text-xs font-semibold tabular-nums">
              {formatValue && p.value != null ? formatValue(p.value) : p.value}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
