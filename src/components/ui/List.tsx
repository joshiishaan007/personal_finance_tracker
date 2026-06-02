import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type UListProps = React.HTMLAttributes<HTMLUListElement>;
type OListProps = React.OlHTMLAttributes<HTMLOListElement>;
type ItemProps = React.LiHTMLAttributes<HTMLLIElement>;

export const List = forwardRef<HTMLUListElement, UListProps>(function List(
  { className, children, ...rest },
  ref,
) {
  return (
    <ul ref={ref} className={cn('space-y-1', className)} {...rest}>
      {children}
    </ul>
  );
});

export const OrderedList = forwardRef<HTMLOListElement, OListProps>(function OrderedList(
  { className, children, ...rest },
  ref,
) {
  return (
    <ol ref={ref} className={cn('space-y-1 list-decimal list-inside', className)} {...rest}>
      {children}
    </ol>
  );
});

export const ListItem = forwardRef<HTMLLIElement, ItemProps>(function ListItem(
  { className, children, ...rest },
  ref,
) {
  return (
    <li ref={ref} className={cn(className)} {...rest}>
      {children}
    </li>
  );
});
