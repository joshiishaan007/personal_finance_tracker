import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Table = forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  function Table({ className, children, ...rest }, ref) {
    return (
      <table ref={ref} className={cn('w-full text-sm text-left border-collapse', className)} {...rest}>
        {children}
      </table>
    );
  },
);

export const THead = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  function THead({ className, children, ...rest }, ref) {
    return (
      <thead ref={ref} className={cn('text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800', className)} {...rest}>
        {children}
      </thead>
    );
  },
);

export const TBody = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  function TBody({ className, children, ...rest }, ref) {
    return (
      <tbody ref={ref} className={cn('divide-y divide-slate-100 dark:divide-slate-900', className)} {...rest}>
        {children}
      </tbody>
    );
  },
);

export const TR = forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  function TR({ className, children, ...rest }, ref) {
    return (
      <tr ref={ref} className={cn(className)} {...rest}>
        {children}
      </tr>
    );
  },
);

export const TH = forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  function TH({ className, children, ...rest }, ref) {
    return (
      <th ref={ref} className={cn('px-3 py-2 font-medium', className)} {...rest}>
        {children}
      </th>
    );
  },
);

export const TD = forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  function TD({ className, children, ...rest }, ref) {
    return (
      <td ref={ref} className={cn('px-3 py-2 text-slate-700 dark:text-slate-300', className)} {...rest}>
        {children}
      </td>
    );
  },
);
