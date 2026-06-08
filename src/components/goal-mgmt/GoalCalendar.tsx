'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { Contribution } from '@/hooks/useContributions';

interface Props {
  contributions: Contribution[];
  color?: string;
  unit?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(20,184,166,${alpha})`;
  return `rgba(${parseInt(m[1]!, 16)},${parseInt(m[2]!, 16)},${parseInt(m[3]!, 16)},${alpha})`;
}

export function GoalCalendar({ contributions, color = '#14B8A6', unit }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (isCurrentMonth) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  // Aggregate contributions for the displayed month
  const valueByDay = new Map<number, number>();
  const notesByDay = new Map<number, string[]>();
  for (const c of contributions) {
    const d = new Date(c.date);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      const day = d.getDate();
      valueByDay.set(day, (valueByDay.get(day) ?? 0) + c.value);
      if (c.note) {
        const arr = notesByDay.get(day) ?? [];
        arr.push(c.note);
        notesByDay.set(day, arr);
      }
    }
  }

  const peak = valueByDay.size > 0 ? Math.max(...valueByDay.values()) : 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0

  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="sm" className="min-h-0 p-1.5" onClick={prevMonth} aria-label="Previous month">
          <ChevronLeft size={15} strokeWidth={2.4} />
        </Button>
        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {MONTHS[month - 1]} {year}
        </Text>
        <Button variant="ghost" size="sm" className="min-h-0 p-1.5" onClick={nextMonth} disabled={isCurrentMonth} aria-label="Next month">
          <ChevronRight size={15} strokeWidth={2.4} />
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <Text key={w} as="span" className="text-center text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {w}
          </Text>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} className="aspect-square" />;

          const value = valueByDay.get(day) ?? 0;
          const isToday = isCurrentMonth && day === now.getDate();
          const hasContrib = value > 0;
          const alpha = hasContrib ? 0.18 + 0.82 * (value / peak) : 0;
          const notes = notesByDay.get(day);
          const tip = hasContrib
            ? `${value} ${unit ?? 'logged'}${notes?.length ? ` — ${notes.join(', ')}` : ''}`
            : `${day} ${MONTHS[month - 1]}`;

          return (
            <div
              key={day}
              title={tip}
              className={[
                'aspect-square rounded-md flex items-center justify-center cursor-default select-none transition-transform hover:scale-110',
                isToday ? 'ring-2 ring-offset-1 ring-brand-500 dark:ring-offset-ink-900' : '',
                !hasContrib ? 'bg-slate-100/80 dark:bg-ink-800/60' : '',
              ].join(' ')}
              style={hasContrib ? { backgroundColor: hexToRgba(color, alpha) } : undefined}
            >
              <Text
                as="span"
                className={[
                  'text-[10px] sm:text-[11px] font-semibold tabular-nums leading-none',
                  hasContrib ? 'text-white' : 'text-slate-400 dark:text-slate-600',
                ].join(' ')}
              >
                {day}
              </Text>
            </div>
          );
        })}
      </div>

      {/* Intensity legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <Text as="span" className="text-[10px] text-slate-400">Less</Text>
        {[0, 0.2, 0.45, 0.7, 1].map((a, i) => (
          <div
            key={i}
            className={['w-3 h-3 rounded-sm', a === 0 ? 'bg-slate-200 dark:bg-ink-700' : ''].join(' ')}
            style={a > 0 ? { backgroundColor: hexToRgba(color, 0.18 + 0.82 * a) } : undefined}
          />
        ))}
        <Text as="span" className="text-[10px] text-slate-400">More</Text>
      </div>
    </div>
  );
}
