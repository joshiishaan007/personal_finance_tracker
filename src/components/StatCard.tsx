'use client';

import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { Text } from '@/components/ui/Text';
import { Sparkline } from '@/components/charts/Sparkline';
import { useCountUp } from '@/hooks/useCountUp';

type Tone = 'brand' | 'accent' | 'aqua' | 'success' | 'warn' | 'danger';

interface Props {
  label: string;
  value: number;
  format: (n: number) => string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: { value: number; label?: string };
  spark?: number[];
  gradient?: boolean;
}

const toneVar: Record<Tone, string> = {
  brand: 'var(--chart-1)',
  accent: 'var(--chart-2)',
  aqua: 'var(--chart-3)',
  success: 'var(--chart-4)',
  warn: 'var(--chart-5)',
  danger: 'var(--chart-6)',
};

export function StatCard({ label, value, format, icon, tone = 'brand', delta, spark, gradient = false }: Props) {
  const counted = useCountUp(value);
  const deltaUp = delta ? delta.value >= 0 : false;

  return (
    <Card variant={gradient ? 'gradient' : 'glass'} interactive padding="none" className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <IconBadge icon={icon} tone={tone} />
          {delta && (
            <div
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                deltaUp
                  ? 'bg-success-500/15 text-success-600 dark:text-success-300'
                  : 'bg-danger-500/15 text-danger-600 dark:text-danger-300',
              )}
            >
              {deltaUp ? <ArrowUpRight size={13} strokeWidth={2.4} /> : <ArrowDownRight size={13} strokeWidth={2.4} />}
              <Text as="span" className="tabular-nums text-xs font-semibold">
                {Math.abs(delta.value)}%{delta.label ? ` ${delta.label}` : ''}
              </Text>
            </div>
          )}
        </div>
        <Text as="span" variant="small" className="mt-3 block uppercase tracking-wide text-[10px]">{label}</Text>
        <Text as="span" className="mt-0.5 block font-display font-bold text-2xl text-slate-900 dark:text-slate-50 tabular-nums">
          {format(counted)}
        </Text>
      </div>
      {spark && spark.length > 0 && (
        <Sparkline data={spark} colorVar={toneVar[tone]} height={36} />
      )}
    </Card>
  );
}
