'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

export function AreaTrend({ data, xKey, series, height = 240, formatValue, formatY }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.colorVar} stopOpacity={0.45} />
              <stop offset="100%" stopColor={s.colorVar} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis width={36} {...axisProps} tickFormatter={formatY} />
        <Tooltip cursor={{ stroke: 'var(--chart-grid)' }} content={<ChartTooltip formatValue={formatValue} />} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.colorVar}
            strokeWidth={2.5}
            fill={`url(#area-${s.key})`}
            dot={false}
            activeDot={{ r: 5, fill: s.colorVar, stroke: 'var(--surface)', strokeWidth: 2, style: { filter: 'drop-shadow(0 0 6px ' + s.colorVar + ')' } }}
            animationDuration={850}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
