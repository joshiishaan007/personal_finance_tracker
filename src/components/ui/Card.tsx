import { cn } from '@/lib/utils';

type Variant = 'default' | 'glass' | 'gradient' | 'plain';

interface Props {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  variant?: Variant;
  interactive?: boolean;
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

const variantMap: Record<Variant, string> = {
  default: 'bg-white/75 dark:bg-ink-900/65 backdrop-blur-xl backdrop-saturate-150 border border-white/60 dark:border-white/[0.07] shadow-card',
  glass: 'glass shadow-card',
  gradient: 'bg-aurora-soft border border-white/50 dark:border-white/10 shadow-card',
  plain: 'bg-white dark:bg-ink-900',
};

export function Card({ children, className, padding = 'md', variant = 'default', interactive = false }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        variantMap[variant],
        paddingMap[padding],
        interactive && 'transition-all duration-200 active:scale-[0.98] hover:shadow-card-lg cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
