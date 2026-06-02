import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'accent' | 'aqua' | 'success' | 'warn' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const toneMap: Record<Tone, string> = {
  brand: 'bg-brand-500/15 text-brand-600 dark:text-brand-300',
  accent: 'bg-accent-500/15 text-accent-600 dark:text-accent-300',
  aqua: 'bg-aqua-500/15 text-aqua-600 dark:text-aqua-300',
  success: 'bg-success-500/15 text-success-600 dark:text-success-300',
  warn: 'bg-warn-500/15 text-warn-600 dark:text-warn-400',
  danger: 'bg-danger-500/15 text-danger-600 dark:text-danger-300',
};

const sizeMap: Record<Size, string> = { sm: 'w-8 h-8 rounded-lg', md: 'w-10 h-10 rounded-xl', lg: 'w-12 h-12 rounded-2xl' };
const iconPx: Record<Size, number> = { sm: 16, md: 18, lg: 22 };

interface Props {
  icon: LucideIcon;
  tone?: Tone;
  size?: Size;
  gradient?: boolean;
  className?: string;
}

export function IconBadge({ icon: Icon, tone = 'brand', size = 'md', gradient = false, className }: Props) {
  return (
    <span className={cn('inline-flex items-center justify-center shrink-0', gradient ? 'bg-aurora text-white shadow-glow' : toneMap[tone], sizeMap[size], className)}>
      <Icon size={iconPx[size]} strokeWidth={2.2} />
    </span>
  );
}
