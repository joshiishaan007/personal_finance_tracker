'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/Label';

// Curated set of finance- and lifestyle-relevant emoji, kept to 30 so the
// grid stays compact (6 columns × 5 rows).
const ICONS = [
  '💰', '💵', '💸', '💳', '📈', '💹',
  '🏦', '💎', '🐷', '🎯', '📦', '🏠',
  '🔌', '💧', '🛒', '📱', '🚗', '✈️',
  '🚌', '⛽', '🍔', '🍕', '☕', '🍽️',
  '🛍️', '💊', '🏋️', '🎬', '📚', '🎁',
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function IconPicker({ value, onChange, label, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {label && (
        <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">{label}</Label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2.5 h-10 w-full px-3 rounded-xl border transition-colors',
          'bg-white dark:bg-ink-800 text-left',
          open
            ? 'border-brand-400 ring-2 ring-brand-400/20'
            : 'border-slate-200 dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-600',
        )}
      >
        <span className="text-xl leading-none select-none">{value || '❓'}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">tap to change</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop — closes picker on outside tap */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute top-full left-0 mt-1.5 z-50 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-800 shadow-xl p-2 w-52">
            <div className="grid grid-cols-6 gap-0.5">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => { onChange(icon); setOpen(false); }}
                  className={cn(
                    'flex items-center justify-center rounded-lg p-1.5 text-xl leading-none transition-colors active:scale-90',
                    value === icon
                      ? 'bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-400 dark:ring-brand-500'
                      : 'hover:bg-slate-100 dark:hover:bg-ink-700',
                  )}
                  aria-label={icon}
                  aria-pressed={value === icon}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
