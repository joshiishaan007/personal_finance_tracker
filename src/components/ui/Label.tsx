import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Props = React.LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, Props>(function Label(
  { className, children, ...rest },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-slate-700 dark:text-slate-300', className)}
      {...rest}
    >
      {children}
    </label>
  );
});
