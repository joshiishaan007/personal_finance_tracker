'use client';

import { Wallet, Target } from 'lucide-react';
import { useMode } from '@/contexts/ModeContext';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/utils';
import type { AppMode } from '@/lib/mode';

const OPTIONS: { mode: AppMode; label: string; icon: typeof Wallet }[] = [
  { mode: 'finance', label: 'Finance', icon: Wallet },
  { mode: 'goals', label: 'Goals', icon: Target },
];

// Segmented Finance/Goals toggle. The active pill uses the `gradient` Button
// (bg-aurora), which is mode-driven — steel-blue in Finance, teal in Goals.
export function ModeSwitcher({ className }: { className?: string }) {
  const { mode, switchMode } = useMode();

  return (
    <div
      role="tablist"
      aria-label="Switch app mode"
      className={cn('flex gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-ink-800/70', className)}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = mode === opt.mode;
        return (
          <Button
            key={opt.mode}
            variant={active ? 'gradient' : 'ghost'}
            size="sm"
            role="tab"
            aria-selected={active}
            onClick={() => switchMode(opt.mode)}
            className="min-h-0 flex-1 gap-1.5 py-1.5"
          >
            <Icon size={15} strokeWidth={2.4} />
            {/* cn() is a plain join (no tw-merge), so Text's default slate color would
                win over the gradient's white — force white on the active pill. */}
            <Text as="span" className={cn('text-sm font-medium', active ? '!text-white' : 'text-current')}>{opt.label}</Text>
          </Button>
        );
      })}
    </div>
  );
}
