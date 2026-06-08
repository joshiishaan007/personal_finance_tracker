'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/Label';

// ── Icon catalogue ────────────────────────────────────────────────────────────
// Grouped so the picker shows a compact category tab bar.
// Each group has exactly 18 icons → 3 rows of 6 columns.

const GROUPS: { label: string; icon: string; icons: string[] }[] = [
  {
    label: 'Finance',
    icon: '💰',
    icons: [
      '💰', '💵', '💸', '💳', '💹', '📈',
      '📉', '🏦', '💎', '🪙', '🏧', '💲',
      '🧾', '📊', '🔐', '💴', '💶', '💷',
    ],
  },
  {
    label: 'Property',
    icon: '🏠',
    icons: [
      '🐷', '🏠', '🏡', '🏢', '🏗️', '🔑',
      '🚗', '🚕', '🛻', '🚌', '🛵', '🚂',
      '✈️', '⛽', '🔌', '💧', '🔥', '📦',
    ],
  },
  {
    label: 'Food',
    icon: '🍔',
    icons: [
      '🍔', '🍕', '☕', '🍽️', '🍜', '🍣',
      '🥗', '🍷', '🍺', '🧋', '🍰', '🥐',
      '🛒', '💊', '🏋️', '🧘', '🏥', '🦷',
    ],
  },
  {
    label: 'Goals',
    icon: '🎯',
    icons: [
      '🎯', '🏆', '🥇', '🌟', '⭐', '🚀',
      '🎖️', '🏅', '🌱', '🔥', '⚡', '💪',
      '🌈', '🎉', '🥂', '🏁', '🎗️', '🌄',
    ],
  },
  {
    label: 'Work',
    icon: '💼',
    icons: [
      '💼', '📋', '✅', '📌', '📍', '⏰',
      '⏱️', '🗓️', '📅', '🔔', '📢', '🤝',
      '📝', '✏️', '📚', '🎓', '💻', '👔',
    ],
  },
  {
    label: 'Lifestyle',
    icon: '🎨',
    icons: [
      '🎬', '🎮', '🎵', '🎨', '🎲', '📷',
      '🛍️', '🎁', '🎭', '🏊', '🧗', '🌍',
      '♻️', '👗', '💄', '🌸', '🌻', '🎪',
    ],
  },
];

// Flat list used when "All" is selected.
const ALL_ICONS = GROUPS.flatMap((g) => g.icons);

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function IconPicker({ value, onChange, label, className }: Props) {
  const [open,        setOpen]        = useState(false);
  const [activeGroup, setActiveGroup] = useState<number | 'all'>(0);

  const visibleIcons = activeGroup === 'all'
    ? ALL_ICONS
    : (GROUPS[activeGroup]?.icons ?? []);

  return (
    <div className={cn('relative', className)}>
      {label && (
        <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">
          {label}
        </Label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 h-10 w-full px-2 rounded-xl border transition-colors',
          'bg-white dark:bg-ink-800',
          open
            ? 'border-brand-400 ring-2 ring-brand-400/20'
            : 'border-slate-200 dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-600',
        )}
      >
        <span className="text-xl leading-none select-none">{value || '❓'}</span>
        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none">change</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />

          <div className="absolute top-full left-0 mt-1.5 z-50 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-ink-800 shadow-xl overflow-hidden w-56">

            {/* Category tabs */}
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide border-b border-slate-100 dark:border-white/[0.06] px-1.5 py-1.5">
              {/* "All" tab */}
              <button
                type="button"
                onClick={() => setActiveGroup('all')}
                className={cn(
                  'shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-colors',
                  activeGroup === 'all'
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
                )}
              >
                All
              </button>
              {GROUPS.map((g, i) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setActiveGroup(i)}
                  title={g.label}
                  className={cn(
                    'shrink-0 rounded-lg px-1.5 py-0.5 text-base leading-none transition-colors',
                    activeGroup === i
                      ? 'bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-300 dark:ring-brand-600'
                      : 'hover:bg-slate-100 dark:hover:bg-ink-700',
                  )}
                  aria-label={g.label}
                  aria-pressed={activeGroup === i}
                >
                  {g.icon}
                </button>
              ))}
            </div>

            {/* Icon grid */}
            <div
              className={cn(
                'grid grid-cols-6 gap-0.5 p-2 overflow-y-auto',
                activeGroup === 'all' ? 'max-h-52' : 'max-h-32',
              )}
            >
              {visibleIcons.map((icon) => (
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
