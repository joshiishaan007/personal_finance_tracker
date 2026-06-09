'use client';

import { cn } from '@/lib/utils';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  // Accessible name when the switch has no adjacent visible label.
  label?: string;
  disabled?: boolean;
  className?: string;
}

// On/off toggle. The visible track is 44×24, and a transparent `before` layer
// extends the hit area to a full 44px tall so it's comfortably tappable on
// touch screens without changing surrounding layout.
export function Switch({ checked, onChange, label, disabled, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        'before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[""]',
        'active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-brand-500' : 'bg-slate-300 dark:bg-ink-600',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
