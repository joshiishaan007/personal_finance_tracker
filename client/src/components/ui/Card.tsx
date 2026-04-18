import { cn } from '../../lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function Card({ children, className, padding = 'md' }: Props) {
  return (
    <div className={cn(
      'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl',
      paddingMap[padding],
      className,
    )}>
      {children}
    </div>
  );
}
