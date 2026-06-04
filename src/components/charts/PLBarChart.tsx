'use client';

import { useState, useCallback } from 'react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { axisProps, gridProps } from './chartTheme';
import { Text } from '@/components/ui/Text';

interface DataPoint {
  label: string;
  net: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  formatY?: (v: number) => string;
}

// Profit/loss bar chart: green bars for positive months, red for negative.
// Tooltip is an inline center label — no white box.
export function PLBarChart({ data, height = 240, formatValue, formatY }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const onEnter = useCallback((_: unknown, idx: number) => setActiveIdx(idx), []);
  const onLeave = useCallback(() => setActiveIdx(null), []);

  const active = activeIdx != null ? data[activeIdx] : null;

  return (
    <div className="space-y-2">
      {/* Inline label — shown above chart when hovering a bar */}
      <div className="h-5 flex items-center justify-center">
        {active ? (
          <Text as="span" className="text-xs font-semibold tabular-nums">
            <Text as="span" className={`mr-1 ${active.net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-500'}`}>
              {active.net >= 0 ? '▲' : '▼'}
            </Text>
            {active.label} — {formatValue ? formatValue(Math.abs(active.net)) : String(Math.abs(active.net))}
            {' '}
            <Text as="span" className="text-slate-400 font-normal">
              ({active.net >= 0 ? 'profit' : 'loss'})
            </Text>
          </Text>
        ) : (
          <Text as="span" className="text-[10px] text-slate-400">hover a bar to see details</Text>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
          <YAxis width={40} {...axisProps} tickFormatter={formatY} />
          <ReferenceLine y={0} stroke="var(--chart-axis)" strokeWidth={1} strokeDasharray="0" />
          <Bar
            dataKey="net"
            maxBarSize={28}
            radius={[4, 4, 4, 4]}
            animationDuration={850}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.net >= 0 ? 'var(--chart-4)' : '#EF4444'}
                fillOpacity={activeIdx == null || activeIdx === i ? 0.9 : 0.35}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
