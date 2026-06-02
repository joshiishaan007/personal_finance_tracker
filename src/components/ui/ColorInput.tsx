import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const ColorInput = forwardRef<HTMLInputElement, Props>(function ColorInput(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="color"
      {...rest}
      className={cn(
        'h-8 w-12 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
        className,
      )}
    />
  );
});
