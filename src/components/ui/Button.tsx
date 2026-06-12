'use client';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'gradient' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  // No glow shadows or filter-based hovers on buttons: the soft halo reads as a
  // blurry button, and brightness() composites the label (grayscale AA) on hover.
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  gradient: 'bg-aurora bg-[length:200%_200%] text-white shadow-sm hover:animate-gradient-shift',
  secondary: 'bg-slate-100 dark:bg-ink-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-ink-700',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 shadow-sm',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-ink-800',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-xl min-h-[36px] gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px] gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl min-h-[52px] gap-2',
};

export function Button({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, className, children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-[background-color,color,opacity,transform] duration-100 active:scale-[0.97] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading
        ? <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : <>{leftIcon}{children}{rightIcon}</>}
    </button>
  );
}
