'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseLocal(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplay(v?: string): string {
  const d = parseLocal(v);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props {
  value?: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value, onChange, label, placeholder = 'Pick a date',
  error, hint, min, max, disabled, className,
}: Props) {
  const [open, setOpen]         = useState(false);
  const [viewYear, setViewYear] = useState(() => parseLocal(value)?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseLocal(value)?.getMonth() ?? new Date().getMonth());
  const [pos, setPos]           = useState({ top: 0, left: 0, minW: 280 });
  const triggerRef              = useRef<HTMLButtonElement>(null);
  const popRef                  = useRef<HTMLDivElement>(null);

  const today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const selected  = parseLocal(value);
  const minDate   = parseLocal(min);
  const maxDate   = parseLocal(max);

  // Keep view in sync when value changes
  useEffect(() => {
    const d = parseLocal(value);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  }, [value]);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const CAL_H = 330;
    const W = Math.max(r.width, 284);
    let top = window.innerHeight - r.bottom >= CAL_H + 8 ? r.bottom + 6 : r.top - CAL_H - 6;
    let left = r.left;
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (left < 8) left = 8;
    setPos({ top, left, minW: W });
  }, []);

  function openPicker() {
    if (disabled) return;
    calcPos();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node) ||
          popRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toDateStr(d));
    setOpen(false);
  }

  function isDisabled(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day); d.setHours(0,0,0,0);
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  }

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const inputId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={openPicker}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg border bg-white dark:bg-slate-900 transition-colors text-left',
          open
            ? 'border-brand-400 ring-1 ring-brand-400'
            : 'border-slate-300 dark:border-slate-700 hover:border-brand-400',
          error && 'border-danger-500 ring-1 ring-danger-400',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarDays size={15} strokeWidth={2} className={cn('shrink-0', value ? 'text-brand-500' : 'text-slate-400')} />
        <Text as="span" className={cn('flex-1 truncate', !value && 'text-slate-400 dark:text-slate-500')}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
      </button>

      {error && <Text as="span" className="text-xs text-danger-700">{error}</Text>}
      {hint && !error && <Text as="span" className="text-xs text-slate-400">{hint}</Text>}

      {/* Calendar popover via portal */}
      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label="Choose date"
          style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.minW, zIndex: 9999 }}
          className="glass rounded-2xl shadow-2xl p-4 animate-pop"
        >
          {/* Month header */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" className="min-h-0 p-1.5" type="button" onClick={prevMonth}>
              <ChevronLeft size={15} strokeWidth={2.4} />
            </Button>
            <Text className="text-sm font-semibold select-none">
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <Button variant="ghost" size="sm" className="min-h-0 p-1.5" type="button" onClick={nextMonth}>
              <ChevronRight size={15} strokeWidth={2.4} />
            </Button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(w => (
              <Text key={w} as="span" className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400 pb-1 select-none">
                {w}
              </Text>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`b${i}`} className="aspect-square" />;
              const cellDate = new Date(viewYear, viewMonth, day); cellDate.setHours(0,0,0,0);
              const isSel   = selected ? toDateStr(selected) === toDateStr(cellDate) : false;
              const isToday = cellDate.getTime() === today.getTime();
              const dis     = isDisabled(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={dis}
                  onClick={() => !dis && selectDay(day)}
                  className={cn(
                    'aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-all select-none',
                    isSel  && 'bg-brand-500 text-white scale-105 shadow-sm',
                    !isSel && isToday && 'ring-2 ring-brand-400 ring-offset-1 dark:ring-offset-slate-950 text-brand-600 dark:text-brand-300 font-bold',
                    !isSel && !isToday && !dis && 'hover:bg-brand-50 dark:hover:bg-brand-950/40 text-slate-700 dark:text-slate-300',
                    dis && 'opacity-25 cursor-not-allowed text-slate-400',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (!isDisabled(today.getDate()) || viewYear !== today.getFullYear() || viewMonth !== today.getMonth()) {
                  onChange(toDateStr(today));
                  setOpen(false);
                }
              }}
              className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 px-1 py-0.5 rounded transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1 py-0.5 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
