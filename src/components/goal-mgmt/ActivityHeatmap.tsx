'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Flame, Trophy, CalendarCheck, Activity } from 'lucide-react';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import { buildHeatmapWeeks } from '@/lib/heatmap';
import type { HeatmapDay } from '@/hooks/useContributions';

interface Props {
  days: HeatmapDay[];
  peak: number;
}

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

function prevDay(ds: string): string {
  const d = new Date(`${ds}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function titleFor(ds: string, value: number): string {
  const d = new Date(`${ds}T00:00:00Z`);
  const date = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
  return value > 0 ? `${date} · ${value} log${value !== 1 ? 's' : ''}` : `${date} · no activity`;
}

function Stat({ icon: Icon, value, label, tone }: { icon: typeof Flame; value: string | number; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} strokeWidth={2.3} className={tone} />
      <Text as="span" className="text-sm font-bold tabular-nums leading-none">{value}</Text>
      <Text as="span" variant="small" className="leading-none">{label}</Text>
    </div>
  );
}

export function ActivityHeatmap({ days, peak }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const todayKey = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.toISOString().split('T')[0]!;
  }, []);

  const { weeks, monthLabels } = useMemo(() => buildHeatmapWeeks(days), [days]);

  // Streaks + totals over the active days.
  const stats = useMemo(() => {
    const active = new Set(days.filter((d) => d.value > 0).map((d) => d.date));
    const totalLogs = days.reduce((s, d) => s + d.value, 0);

    let current = 0;
    let cursor = active.has(todayKey) ? todayKey : prevDay(todayKey);
    while (active.has(cursor)) { current += 1; cursor = prevDay(cursor); }

    let longest = 0, run = 0, prev: string | null = null;
    for (const ds of [...active].sort()) {
      run = prev && prevDay(ds) === prev ? run + 1 : 1;
      if (run > longest) longest = run;
      prev = ds;
    }
    return { activeDays: active.size, totalLogs, current, longest };
  }, [days, todayKey]);

  // Show the most recent weeks first (scroll to the right end) on mount.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  const totalWidth = LABEL_W + weeks.length * COL;

  return (
    <div className="space-y-3">
      {/* Stat strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Stat icon={Flame} value={stats.current} label="current streak" tone={stats.current ? 'text-warn-500' : 'text-slate-300 dark:text-slate-600'} />
        <Stat icon={Trophy} value={stats.longest} label="best streak" tone="text-brand-500" />
        <Stat icon={CalendarCheck} value={stats.activeDays} label="active days" tone="text-success-500" />
        <Stat icon={Activity} value={stats.totalLogs} label="logs" tone="text-aqua-500" />
      </div>

      <div ref={scrollRef} className="overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
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
            <div className="flex flex-col shrink-0" style={{ width: LABEL_W - GAP, gap: GAP }}>
              {DOW.map((d, i) => (
                <div key={i} style={{ height: CELL }} className="flex items-center justify-end pr-1">
                  <Text as="span" className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">{d}</Text>
                </div>
              ))}
            </div>

            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col shrink-0" style={{ gap: GAP }}>
                {week.map((cell, d) => (
                  <div
                    key={d}
                    style={{ width: CELL, height: CELL, borderRadius: 2 }}
                    className={cn(
                      cell.future ? 'opacity-0' : levelClass(cell.value, peak),
                      !cell.future && 'transition-transform hover:scale-125',
                      !cell.future && cell.date === todayKey && 'ring-2 ring-brand-500/70 ring-offset-1 ring-offset-white dark:ring-offset-ink-900',
                    )}
                    title={cell.future ? undefined : titleFor(cell.date, cell.value)}
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
    </div>
  );
}
