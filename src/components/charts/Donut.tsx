'use client';

import { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CHART_SERIES } from './chartTheme';
import { Text } from '@/components/ui/Text';

interface Props {
  data: Array<{ name: string; value: number }>;
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (v: number) => string;
}

export function Donut({ data, height = 240, centerLabel, centerValue, formatValue }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // recharts onMouseEnter passes (data, index) — we only need the index.
  const onEnter = useCallback((_: unknown, idx: number) => setActiveIdx(idx), []);
  const onLeave = useCallback(() => setActiveIdx(null), []);

  const active = activeIdx != null ? data[activeIdx] : null;

  // While a segment is hovered, swap the center to show that segment's info.
  const displayLabel = active ? active.name : centerLabel;
  const displayValue = active
    ? (formatValue ? formatValue(active.value) : String(active.value))
    : centerValue;

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
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={CHART_SERIES[i % CHART_SERIES.length]}
                // Dim non-active segments so the hovered one pops visually.
                opacity={activeIdx == null || activeIdx === i ? 1 : 0.35}
                style={{ transition: 'opacity 150ms ease, transform 150ms ease' }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {(displayLabel || displayValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center px-4">
          {displayLabel && (
            <Text
              as="span"
              className={`block leading-tight transition-all duration-150 ${
                active
                  ? 'text-[11px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide'
                  : 'text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400'
              }`}
            >
              {displayLabel}
            </Text>
          )}
          {displayValue && (
            <Text
              as="span"
              className="block font-bold tabular-nums text-slate-900 dark:text-slate-50 transition-all duration-150 text-xl leading-tight"
            >
              {displayValue}
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
