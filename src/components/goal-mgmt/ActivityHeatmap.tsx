'use client';

import { useMemo } from 'react';
import { Text } from '@/components/ui/Text';
import type { HeatmapDay } from '@/hooks/useContributions';

interface Props {
  days: HeatmapDay[];
  peak: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const CELL = 12; // px
const GAP = 2;   // px
const COL = CELL + GAP; // 14px per week column
const LABEL_W = 28; // px left gutter for day-of-week labels

function levelClass(value: number, peak: number): string {
  if (value === 0) return 'bg-slate-100 dark:bg-ink-800/80';
  const r = value / peak;
  if (r < 0.15) return 'bg-brand-100 dark:bg-brand-950';
  if (r < 0.35) return 'bg-brand-200 dark:bg-brand-900';
  if (r < 0.60) return 'bg-brand-400 dark:bg-brand-700';
  if (r < 0.85) return 'bg-brand-500 dark:bg-brand-600';
  return 'bg-brand-600 dark:bg-brand-500';
}

export function ActivityHeatmap({ days, peak }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const map = new Map(days.map((d) => [d.date, d.value]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Align start to Monday, 52 weeks back
    const start = new Date(today);
    start.setDate(start.getDate() - 52 * 7);
    const startDow = (start.getDay() + 6) % 7; // Mon=0
    start.setDate(start.getDate() - startDow);

    const weeks: Array<Array<{ date: string; value: number; future: boolean }>> = [];
    const monthLabels: Array<{ col: number; label: string }> = [];
    let lastMonth = -1;
    const cursor = new Date(start);

    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const ds = cursor.toISOString().split('T')[0]!;
        const future = cursor > today;
        if (d === 0 && !future && cursor.getMonth() !== lastMonth) {
          monthLabels.push({ col: w, label: MONTHS[cursor.getMonth()]! });
          lastMonth = cursor.getMonth();
        }
        week.push({ date: ds, value: map.get(ds) ?? 0, future });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return { weeks, monthLabels };
  }, [days]);

  const totalWidth = LABEL_W + weeks.length * COL;

  return (
    <div className="overflow-x-auto pb-1 -mx-1 px-1">
      <div className="relative" style={{ width: totalWidth, minWidth: totalWidth }}>
        {/* Month labels */}
        <div className="relative h-5 mb-0.5" style={{ paddingLeft: LABEL_W }}>
          {monthLabels.map(({ col, label }) => (
            <Text
              key={`${col}-${label}`}
              as="span"
              className="absolute text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none"
              style={{ left: col * COL }}
            >
              {label}
            </Text>
          ))}
        </div>

        {/* Day-of-week labels + week columns */}
        <div className="flex" style={{ gap: GAP }}>
          {/* Day labels */}
          <div
            className="flex flex-col shrink-0"
            style={{ width: LABEL_W - GAP, gap: GAP, paddingTop: 0 }}
          >
            {DOW.map((d, i) => (
              <div key={i} style={{ height: CELL }} className="flex items-center justify-end pr-1">
                <Text as="span" className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">
                  {d}
                </Text>
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, w) => (
            <div key={w} className="flex flex-col shrink-0" style={{ gap: GAP }}>
              {week.map((cell, d) => (
                <div
                  key={d}
                  style={{ width: CELL, height: CELL, borderRadius: 2 }}
                  className={cell.future ? 'opacity-0' : levelClass(cell.value, peak)}
                  title={
                    !cell.future
                      ? cell.value > 0
                        ? `${cell.date}: ${cell.value} log${cell.value !== 1 ? 's' : ''}`
                        : cell.date
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <Text as="span" className="text-[9px] text-slate-400">Less</Text>
          {(['bg-slate-100 dark:bg-ink-800/80', 'bg-brand-100 dark:bg-brand-950', 'bg-brand-300 dark:bg-brand-800', 'bg-brand-500 dark:bg-brand-600', 'bg-brand-600 dark:bg-brand-500'] as const).map((cls, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2 }} className={cls} />
          ))}
          <Text as="span" className="text-[9px] text-slate-400">More</Text>
        </div>
      </div>
    </div>
  );
}
