import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      {...rest}
      className={cn(
        'h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 accent-brand-600',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        'dark:bg-slate-900 cursor-pointer',
        className,
      )}
    />
  );
});
