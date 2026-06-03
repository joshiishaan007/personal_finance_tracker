'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { axisProps, gridProps, type ChartSeries } from './chartTheme';
import { ChartTooltip } from './ChartTooltip';

interface Props {
  data: Array<Record<string, number | string>>;
  xKey: string;
  series: ChartSeries[];
  height?: number;
  formatValue?: (v: number) => string;
  formatY?: (v: number) => string;
}

export function BarsGrouped({ data, xKey, series, height = 240, formatValue, formatY }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`bar-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.colorVar} stopOpacity={1} />
              <stop offset="100%" stopColor={s.colorVar} stopOpacity={0.55} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis width={36} {...axisProps} tickFormatter={formatY} />
        <Tooltip cursor={{ fill: 'var(--chart-grid)', fillOpacity: 0.25 }} content={<ChartTooltip formatValue={formatValue} />} />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={`url(#bar-${s.key})`}
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
            animationDuration={850}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
