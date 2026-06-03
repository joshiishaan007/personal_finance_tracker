import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

interface Props extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: Level;
}

const sizeByLevel: Record<Level, string> = {
  1: 'text-3xl font-bold tracking-tight',
  2: 'text-2xl font-bold tracking-tight',
  3: 'text-xl font-semibold',
  4: 'text-lg font-semibold',
  5: 'text-base font-semibold',
  6: 'text-sm font-semibold',
};

export const Heading = forwardRef<HTMLHeadingElement, Props>(function Heading(
  { level = 1, className, children, ...rest },
  ref,
) {
  const Tag = `h${level}` as const;
  return (
    <Tag ref={ref} className={cn('font-display text-slate-900 dark:text-slate-50', sizeByLevel[level], className)} {...rest}>
      {children}
    </Tag>
  );
});
