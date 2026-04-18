import { cn } from '../../lib/utils';

type Variant = 'default' | 'success' | 'warn' | 'danger' | 'brand';

const variantClasses: Record<Variant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-success-50 text-success-700 dark:bg-success-950/40 dark:text-success-400',
  warn: 'bg-warn-50 text-warn-700 dark:bg-warn-950/40 dark:text-warn-400',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-950/40 dark:text-danger-400',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400',
};

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: Props) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  );
}
