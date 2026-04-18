import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface Option { value: string; label: string; }
interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, options, className, id, ...rest },
  ref,
) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        {...rest}
        className={cn(
          'w-full px-3 py-2.5 text-sm rounded-lg border bg-white dark:bg-slate-900 transition-colors appearance-none',
          error
            ? 'border-danger-400'
            : 'border-slate-300 dark:border-slate-700 focus:border-brand-400',
          'focus:outline-none focus:ring-1 focus:ring-brand-400',
          className,
        )}
        aria-invalid={!!error}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
});
