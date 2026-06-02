'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_SERIES } from './chartTheme';
import { ChartTooltip } from './ChartTooltip';
import { Text } from '@/components/ui/Text';

interface Props {
  data: Array<{ name: string; value: number }>;
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (v: number) => string;
}

export function Donut({ data, height = 240, centerLabel, centerValue, formatValue }: Props) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="none"
            animationDuration={850}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatValue={formatValue} />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerLabel && (
            <Text as="span" variant="small" className="uppercase tracking-wide text-[10px]">{centerLabel}</Text>
          )}
          {centerValue && (
            <Text as="span" className="font-display font-bold text-xl text-slate-900 dark:text-slate-50 tabular-nums">{centerValue}</Text>
          )}
        </div>
      )}
    </div>
  );
}
