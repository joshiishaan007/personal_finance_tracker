import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface Props extends NextLinkProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> {
  className?: string;
  children?: React.ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { className, children, ...rest },
  ref,
) {
  return (
    <NextLink
      ref={ref}
      className={cn('text-brand-600 dark:text-brand-400 hover:underline transition-colors', className)}
      {...rest}
    >
      {children}
    </NextLink>
  );
});
