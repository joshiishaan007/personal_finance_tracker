'use client';

import { useRef } from 'react';
import { Check, Plus } from 'lucide-react';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';

// 12 curated colours — diverse, legible on light and dark backgrounds
export const COLOR_PRESETS = [
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#F43F5E', // rose
  '#64748B', // slate
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  className?: string;
}

export function ColorPicker({ value, onChange, label, className }: Props) {
  const customRef = useRef<HTMLInputElement>(null);
  const isPreset  = COLOR_PRESETS.includes(value);

  return (
    <div className={className}>
      {label && (
        <Text as="span" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">
          {label}
        </Text>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {COLOR_PRESETS.map((hex) => {
          const active = value === hex;
          return (
            <button
              key={hex}
              type="button"
              onClick={() => onChange(hex)}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform',
                active ? 'scale-110' : 'hover:scale-105 active:scale-95',
              )}
              style={{
                backgroundColor: hex,
                ...(active ? { boxShadow: `0 0 0 2px var(--surface), 0 0 0 4px ${hex}` } : {}),
              }}
              title={hex}
              aria-label={hex}
              aria-pressed={active}
            >
              {active && <Check size={11} strokeWidth={3.5} className="text-white drop-shadow" />}
            </button>
          );
        })}

        {/* Custom colour — hidden native input triggered by the visible button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => customRef.current?.click()}
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center transition-all border-2 border-dashed',
              isPreset
                ? 'border-slate-300 dark:border-slate-600 hover:border-brand-400 hover:scale-105'
                : 'scale-110 border-transparent',
            )}
            style={
              !isPreset
                ? { backgroundColor: value, boxShadow: `0 0 0 2px var(--surface), 0 0 0 4px ${value}` }
                : undefined
            }
            title="Custom colour"
            aria-label="Custom colour"
          >
            {isPreset
              ? <Plus size={12} strokeWidth={2.5} className="text-slate-400" />
              : <Check size={11} strokeWidth={3.5} className="text-white drop-shadow" />
            }
          </button>
          <input
            ref={customRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            tabIndex={-1}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
