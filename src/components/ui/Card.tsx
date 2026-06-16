import { cn } from '@/lib/utils';

type Variant = 'default' | 'glass' | 'gradient' | 'plain';

interface Props {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  variant?: Variant;
  interactive?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

const variantMap: Record<Variant, string> = {
  default: 'bg-white dark:bg-ink-900 border border-slate-200 dark:border-white/[0.07] shadow-card',
  // Opaque like default: backdrop-blur on content cards forces GPU compositing,
  // which degrades text to grayscale antialiasing (blurry). The translucent .glass
  // utility is reserved for app chrome (sidebar/header/nav) where content scrolls
  // beneath; content cards must stay crisp.
  glass: 'bg-white dark:bg-ink-900 border border-slate-200 dark:border-white/[0.07] shadow-card',
  gradient: 'bg-aurora-soft border border-white/50 dark:border-white/10 shadow-card',
  plain: 'bg-white dark:bg-ink-900',
};

export function Card({ children, className, padding = 'md', variant = 'default', interactive = false, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl',
        variantMap[variant],
        paddingMap[padding],
        interactive && 'transition-[transform,box-shadow] duration-100 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-card-lg cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
