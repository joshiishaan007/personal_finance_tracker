import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, className, id, ...rest },
  ref,
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        {...rest}
        className={cn(
          'w-full px-3 py-2.5 text-sm rounded-lg border bg-white dark:bg-slate-900 transition-colors',
          error
            ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500'
            : 'border-slate-300 dark:border-slate-700 focus:border-brand-400 focus:ring-brand-400',
          'focus:outline-none focus:ring-1',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
      />
      {error && <p id={`${inputId}-error`} className="text-xs text-danger-600">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
});
