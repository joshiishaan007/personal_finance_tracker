import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
  ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg min-h-[36px]',
  md: 'px-4 py-2 text-sm rounded-lg min-h-[44px]',
  lg: 'px-6 py-3 text-base rounded-xl min-h-[52px]',
};

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  );
}
