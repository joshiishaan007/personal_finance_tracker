'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const ITEM_H  = 40; // px per row

function parseTime(v?: string): { h: string; m: string } {
  if (!v) return { h: '09', m: '00' };
  const [hh, mm] = v.split(':');
  return {
    h: (hh ?? '09').padStart(2, '0'),
    m: String(Math.round(Number(mm ?? 0) / 5) * 5 % 60).padStart(2, '0'),
  };
}

function formatDisplay(v?: string): string {
  if (!v) return '';
  const [hh, mm] = v.split(':');
  const h = Number(hh ?? 0);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, '0')}:${mm ?? '00'} ${suffix}`;
}

interface ScrollColProps {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}

function ScrollCol({ items, value, onChange }: ScrollColProps) {
  const ref   = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Scroll to selected item without animation on mount/value change
  useEffect(() => {
    if (!ref.current) return;
    const idx = items.indexOf(value);
    if (idx >= 0) ref.current.scrollTop = idx * ITEM_H;
  }, [value, items]);

  const onScroll = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const next = items[clamped];
      if (next && next !== value) onChange(next);
    }, 80);
  }, [items, value, onChange]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="relative flex-1">
      {/* Highlight band — sits behind the centre row */}
      <div
        className="pointer-events-none absolute inset-x-0 bg-brand-50 dark:bg-brand-950/50 border-y border-brand-200/70 dark:border-brand-700/50 rounded-lg z-0"
        style={{ top: ITEM_H, height: ITEM_H }}
      />
      <div
        ref={ref}
        className="overflow-y-scroll scrollbar-hide relative z-10"
        style={{ height: ITEM_H * 3, scrollSnapType: 'y mandatory' }}
        onScroll={onScroll}
      >
        {/* top spacer so first item can reach centre */}
        <div style={{ height: ITEM_H, scrollSnapAlign: 'none' }} />
        {items.map((item) => (
          <div
            key={item}
            style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
            className={cn(
              'flex items-center justify-center text-sm font-semibold select-none cursor-pointer transition-colors',
              item === value
                ? 'text-brand-600 dark:text-brand-300'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
            )}
            onClick={() => {
              onChange(item);
              const idx = items.indexOf(item);
              ref.current?.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
            }}
          >
            {item}
          </div>
        ))}
        {/* bottom spacer */}
        <div style={{ height: ITEM_H, scrollSnapAlign: 'none' }} />
      </div>
    </div>
  );
}

interface Props {
  value?: string;
  onChange: (v: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({ value, onChange, label, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const triggerRef      = useRef<HTMLButtonElement>(null);
  const popRef          = useRef<HTMLDivElement>(null);

  const { h, m } = parseTime(value);
  const [pendingH, setPendingH] = useState(h);
  const [pendingM, setPendingM] = useState(m);

  // Sync local state when popover opens
  useEffect(() => {
    if (open) {
      const p = parseTime(value);
      setPendingH(p.h);
      setPendingM(p.m);
    }
  }, [open, value]);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r  = triggerRef.current.getBoundingClientRect();
    const PH = 210;
    const PW = 200;
    const top  = window.innerHeight - r.bottom >= PH + 8 ? r.bottom + 6 : r.top - PH - 6;
    let left = r.left;
    if (left + PW > window.innerWidth - 8) left = window.innerWidth - PW - 8;
    setPos({ top, left });
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

  function confirm() {
    onChange(`${pendingH}:${pendingM}`);
    setOpen(false);
  }

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
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Clock size={15} strokeWidth={2} className={cn('shrink-0', value ? 'text-brand-500' : 'text-slate-400')} />
        <Text as="span" className={cn('flex-1 tabular-nums', !value && 'text-slate-400 dark:text-slate-500')}>
          {value ? formatDisplay(value) : 'Pick a time'}
        </Text>
      </button>

      {/* Scroll picker popover */}
      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label="Choose time"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 200, zIndex: 9999 }}
          className="glass rounded-2xl shadow-2xl p-4 animate-pop"
        >
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 select-none">
            Select time
          </Text>

          {/* Two scroll columns */}
          <div className="flex items-center gap-1">
            <ScrollCol items={HOURS}   value={pendingH} onChange={setPendingH} />
            <Text as="span" className="text-lg font-bold text-slate-400 select-none shrink-0 mb-0.5">:</Text>
            <ScrollCol items={MINUTES} value={pendingM} onChange={setPendingM} />
          </div>

          {/* Column labels */}
          <div className="flex gap-1 mt-1 mb-3">
            <Text as="span" className="flex-1 text-center text-[10px] text-slate-400 uppercase tracking-wide select-none">Hour</Text>
            <div className="w-4" />
            <Text as="span" className="flex-1 text-center text-[10px] text-slate-400 uppercase tracking-wide select-none">Min</Text>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-ink-800/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              className="flex-1 py-1.5 text-sm font-semibold text-white rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors"
            >
              Set
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
