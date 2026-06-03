import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'body' | 'muted' | 'small';

interface Props extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span';
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  body: 'text-sm text-slate-700 dark:text-slate-300',
  muted: 'text-sm text-slate-500 dark:text-slate-400',
  small: 'text-xs text-slate-500 dark:text-slate-400',
};

export const Text = forwardRef<HTMLElement, Props>(function Text(
  { as = 'p', variant = 'body', className, children, ...rest },
  ref,
) {
  const Tag = as;
  return (
    <Tag ref={ref as never} className={cn(variantClasses[variant], className)} {...rest}>
      {children}
    </Tag>
  );
});
