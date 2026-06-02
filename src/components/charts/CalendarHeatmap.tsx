'use client';

import { Text } from '@/components/ui/Text';

interface Props {
  days: Array<{ day: number; value: number }>;
  month: number; // 1-12
  year: number;
  max?: number;
  formatValue?: (v: number) => string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarHeatmap({ days, month, year, max, formatValue }: Props) {
  const valueByDay = new Map(days.map((d) => [d.day, d.value]));
  const peak = max ?? Math.max(1, ...days.map((d) => d.value));
  const daysInMonth = new Date(year, month, 0).getDate();

  // JS getDay: 0=Sun..6=Sat. Shift to Mon=0..Sun=6 so the grid starts Monday.
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  const cells: Array<{ day: number } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-1">
        {WEEKDAYS.map((w) => (
          <Text key={w} as="span" variant="small" className="text-center text-[9px] sm:text-[10px] uppercase tracking-wide">
            {w}
          </Text>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} className="aspect-square" />;
          const value = valueByDay.get(cell.day) ?? 0;
          const opacity = value > 0 ? 0.1 + 0.9 * (value / peak) : 0.1;
          const formatted = formatValue ? formatValue(value) : String(value);
          return (
            <div
              key={cell.day}
              title={`${formatted} on day ${cell.day}`}
              className="aspect-square rounded-md sm:rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--chart-1)', opacity }}
            >
              <Text as="span" className="text-[9px] sm:text-[10px] font-medium text-white/90 tabular-nums leading-none">
                {cell.day}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
