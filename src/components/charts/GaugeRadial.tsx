'use client';

import { useId } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Text } from '@/components/ui/Text';

interface Props {
  value: number;
  max?: number;
  label?: string;
  colorVar?: string;
  height?: number;
  suffix?: string;
}

export function GaugeRadial({
  value,
  max = 100,
  label,
  colorVar = 'var(--chart-1)',
  height = 180,
  suffix = '',
}: Props) {
  const clamped = Math.min(Math.max(value, 0), max);
  const id = useId().replace(/:/g, '');
  const data = [{ name: 'value', value: clamped, fill: `url(#gauge-${id})` }];

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          startAngle={220}
          endAngle={-40}
          data={data}
        >
          <defs>
            <linearGradient id={`gauge-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={colorVar} stopOpacity={0.9} />
              <stop offset="100%" stopColor={colorVar} stopOpacity={1} />
            </linearGradient>
          </defs>
          <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
          <RadialBar
            dataKey="value"
            cornerRadius={999}
            background={{ fill: 'var(--chart-grid)' }}
            animationDuration={850}
            style={{ filter: `drop-shadow(0 0 8px ${colorVar})` }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <Text as="span" className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50 tabular-nums">
          {Math.round(clamped)}{suffix}
        </Text>
        {label && <Text as="span" variant="small" className="mt-0.5">{label}</Text>}
      </div>
    </div>
  );
}
